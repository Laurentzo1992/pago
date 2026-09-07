from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.filters import apply_infrastructure_filters
from app.models import Infrastructure
from app.schemas import (
    InfrastructureFilter,
    InfrastructureOut,
    PaginatedInfrastructureFilter,
    PaginatedInfrastructuresOut,
)

router = APIRouter()


def _filtered_query(filters: InfrastructureFilter | PaginatedInfrastructureFilter):
    return apply_infrastructure_filters(select(Infrastructure), filters)


@router.post("/api/infrastructures", response_model=list[InfrastructureOut])
def get_infrastructures(filters: InfrastructureFilter, db: Session = Depends(get_db)):
    # Mirrors the original Django view: no results are returned until at
    # least one type is selected.
    if not filters.selected_types:
        return []

    stmt = _filtered_query(filters)
    return db.execute(stmt).scalars().all()


@router.post("/api/infrastructures/paginated", response_model=PaginatedInfrastructuresOut)
def get_paginated_infrastructures(filters: PaginatedInfrastructureFilter, db: Session = Depends(get_db)):
    base_stmt = _filtered_query(filters)

    total_items = db.execute(select(func.count()).select_from(base_stmt.subquery())).scalar_one()
    page = max(filters.page, 1)
    page_size = max(filters.page_size, 1)
    pages = max((total_items + page_size - 1) // page_size, 1)

    page_stmt = base_stmt.offset((page - 1) * page_size).limit(page_size)
    data = db.execute(page_stmt).scalars().all()

    return PaginatedInfrastructuresOut(data=data, total_items=total_items, page=page, pages=pages)
