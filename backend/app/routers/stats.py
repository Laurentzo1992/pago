from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.filters import apply_infrastructure_filters
from app.models import Arrondissement, Commune, Infrastructure, Quartier, Secteur, Status, Type
from app.schemas import (
    CategoryStat,
    CommuneStat,
    ConditionStat,
    InfrastructureFilter,
    StatsOut,
    StatusStat,
)

router = APIRouter()


def _root_type_ids(db: Session) -> dict[int, int]:
    """Map every type id to its top-level (root) ancestor id."""
    rows = db.execute(select(Type.id, Type.parent_id)).all()
    parent_of = {row.id: row.parent_id for row in rows}
    cache: dict[int, int] = {}

    def root_of(type_id: int) -> int:
        if type_id in cache:
            return cache[type_id]
        parent_id = parent_of.get(type_id)
        root = type_id if parent_id is None else root_of(parent_id)
        cache[type_id] = root
        return root

    return {type_id: root_of(type_id) for type_id in parent_of}


@router.post("/api/stats", response_model=StatsOut)
def get_stats(filters: InfrastructureFilter, db: Session = Depends(get_db)):
    # Unlike /api/infrastructures, this always aggregates over whatever
    # filters are active (including none, i.e. the whole dataset) - there is
    # no "empty selection means empty result" rule for the analytics cards.
    total = db.execute(apply_infrastructure_filters(select(func.count(Infrastructure.id)), filters)).scalar_one()

    type_counts = db.execute(
        apply_infrastructure_filters(
            select(Infrastructure.type_id, func.count().label("n")).group_by(Infrastructure.type_id), filters
        )
    ).all()

    root_of = _root_type_ids(db)
    type_names = {row.id: row.type for row in db.execute(select(Type.id, Type.type)).all()}

    by_root: dict[int, int] = {}
    for row in type_counts:
        if row.type_id is None:
            continue
        root_id = root_of.get(row.type_id, row.type_id)
        by_root[root_id] = by_root.get(root_id, 0) + row.n

    by_category = [
        CategoryStat(type_id=root_id, name=type_names.get(root_id) or "Autres", count=count)
        for root_id, count in sorted(by_root.items(), key=lambda kv: -kv[1])
    ]

    status_counts = db.execute(
        apply_infrastructure_filters(
            select(Infrastructure.status_id, func.count().label("n")).group_by(Infrastructure.status_id), filters
        )
    ).all()
    status_names = {s.id: s.status for s in db.execute(select(Status)).scalars().all()}
    by_status = sorted(
        (
            StatusStat(status_id=row.status_id, name=status_names.get(row.status_id) or "N/A", count=row.n)
            for row in status_counts
            if row.status_id is not None
        ),
        key=lambda s: -s.count,
    )

    commune_stmt = apply_infrastructure_filters(
        select(Commune.id, Commune.nom_commune, func.count().label("n"))
        .select_from(Infrastructure)
        .join(Quartier, Infrastructure.quartier_id == Quartier.id)
        .join(Secteur, Quartier.secteur_id == Secteur.id)
        .join(Arrondissement, Secteur.arrondissement_id == Arrondissement.id)
        .join(Commune, Arrondissement.commune_id == Commune.id)
        .group_by(Commune.id, Commune.nom_commune)
        .order_by(func.count().desc())
        .limit(10),
        filters,
    )
    top_communes = [
        CommuneStat(commune_id=row.id, name=row.nom_commune or "N/A", count=row.n)
        for row in db.execute(commune_stmt).all()
    ]

    condition_counts = db.execute(
        apply_infrastructure_filters(
            select(Infrastructure.etat, func.count().label("n")).group_by(Infrastructure.etat), filters
        )
    ).all()
    by_condition = sorted(
        (
            ConditionStat(etat=row.etat, count=row.n)
            for row in condition_counts
            if row.etat and row.etat != "N/A"
        ),
        key=lambda c: -c.count,
    )

    return StatsOut(
        total=total,
        by_category=by_category,
        by_status=by_status,
        top_communes=top_communes,
        by_condition=by_condition,
    )
