from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class LegendOut(BaseModel):
    description: str
    image: str


class TypeNodeOut(BaseModel):
    id: int
    level: int
    name: str | None
    legend: LegendOut | None
    children: list["TypeNodeOut"]


class QuartierOut(BaseModel):
    id: int
    name: str | None


class SecteurOut(BaseModel):
    id: int
    name: str | None
    quartiers: list[QuartierOut]


class ArrondissementOut(BaseModel):
    id: int
    name: str | None
    secteurs: list[SecteurOut]


class CommuneOut(BaseModel):
    id: int
    name: str | None
    arrondissements: list[ArrondissementOut]


class StatusOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str | None


class GuideOut(BaseModel):
    id: int
    file: str | None
    url: str | None


class InfrastructureFilter(BaseModel):
    selected_types: list[int] = []
    selected_quarters: list[int] = []
    selected_statuses: list[int] = []


class PaginatedInfrastructureFilter(BaseModel):
    selected_types: list[int] = []
    selected_quarters: list[int] = []
    page: int = 1
    page_size: int = 10


class InfrastructureOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nom: str | None
    type_id: int | None
    quartier_id: int | None
    status_id: int | None
    repondant_id: int | None
    etat_voie: str | None
    emplacement: str | None
    cloture: str | None
    accessibilite: str | None
    etat: str | None
    latitude: str | None
    longitude: str | None
    altitude: str | None
    precision: str | None


class PaginatedInfrastructuresOut(BaseModel):
    data: list[InfrastructureOut]
    total_items: int
    page: int
    pages: int


class CategoryStat(BaseModel):
    type_id: int
    name: str
    count: int


class StatusStat(BaseModel):
    status_id: int
    name: str
    count: int


class CommuneStat(BaseModel):
    commune_id: int
    name: str
    count: int


class ConditionStat(BaseModel):
    etat: str
    count: int


class StatsOut(BaseModel):
    total: int
    by_category: list[CategoryStat]
    by_status: list[StatusStat]
    top_communes: list[CommuneStat]
    by_condition: list[ConditionStat]
