from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Legend, Type
from app.schemas import LegendOut, TypeNodeOut

router = APIRouter()


def _build_tree(node: Type, level: int, legends_by_type: dict[int, Legend], children_by_parent: dict[int | None, list[Type]]) -> TypeNodeOut:
    legend = legends_by_type.get(node.id)
    legend_out = LegendOut(description=legend.description, image=f"{settings.media_url}/{legend.image}") if legend else None
    return TypeNodeOut(
        id=node.id,
        level=level,
        name=node.type,
        legend=legend_out,
        children=[
            _build_tree(child, level + 1, legends_by_type, children_by_parent)
            for child in children_by_parent.get(node.id, [])
        ],
    )


@router.get("/api/types", response_model=list[TypeNodeOut])
def get_types(db: Session = Depends(get_db)):
    all_types = db.execute(select(Type)).scalars().all()
    legends = db.execute(select(Legend)).scalars().all()
    legends_by_type = {legend.type_id: legend for legend in legends}

    children_by_parent: dict[int | None, list[Type]] = {}
    for t in all_types:
        children_by_parent.setdefault(t.parent_id, []).append(t)

    roots = children_by_parent.get(None, [])
    return [_build_tree(root, 0, legends_by_type, children_by_parent) for root in roots]
