from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Infrastructure
from app.schemas import (
    InfrastructureFilter,
    InfrastructureOut,
    PaginatedInfrastructureFilter,
    PaginatedInfrastructuresOut,
)

router = APIRouter()


def _filtered_query(filters: InfrastructureFilter | PaginatedInfrastructureFilter):
    stmt = select(Infrastructure)
    if filters.selected_types:
        stmt = stmt.where(Infrastructure.type_id.in_(filters.selected_types))
    if filters.selected_quarters:
        stmt = stmt.where(Infrastructure.quartier_id.in_(filters.selected_quarters))
    if isinstance(filters, InfrastructureFilter) and filters.selected_statuses:
        stmt = stmt.where(Infrastructure.status_id.in_(filters.selected_statuses))
    return stmt


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

    total_items = len(db.execute(base_stmt).scalars().all())
    page = max(filters.page, 1)
    page_size = max(filters.page_size, 1)
    pages = max((total_items + page_size - 1) // page_size, 1)

    page_stmt = base_stmt.offset((page - 1) * page_size).limit(page_size)
    data = db.execute(page_stmt).scalars().all()

    return PaginatedInfrastructuresOut(data=data, total_items=total_items, page=page, pages=pages)
