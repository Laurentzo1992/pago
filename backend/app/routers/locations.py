from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Arrondissement, Commune, Secteur
from app.schemas import ArrondissementOut, CommuneOut, QuartierOut, SecteurOut

router = APIRouter()


@router.get("/api/locations", response_model=list[CommuneOut])
def get_locations(db: Session = Depends(get_db)):
    communes = (
        db.execute(
            select(Commune).options(
                selectinload(Commune.arrondissements)
                .selectinload(Arrondissement.secteurs)
                .selectinload(Secteur.quartiers)
            )
        )
        .scalars()
        .unique()
        .all()
    )

    return [
        CommuneOut(
            id=commune.id,
            name=commune.nom_commune,
            arrondissements=[
                ArrondissementOut(
                    id=arrondissement.id,
                    name=arrondissement.nom_arrondissement,
                    secteurs=[
                        SecteurOut(
                            id=secteur.id,
                            name=secteur.nom_secteur,
                            quartiers=[
                                QuartierOut(id=quartier.id, name=quartier.nom_quartier)
                                for quartier in secteur.quartiers
                            ],
                        )
                        for secteur in arrondissement.secteurs
                    ],
                )
                for arrondissement in commune.arrondissements
            ],
        )
        for commune in communes
    ]
