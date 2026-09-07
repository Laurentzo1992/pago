from __future__ import annotations

from sqlalchemy.sql import Select

from app.models import Infrastructure
from app.schemas import InfrastructureFilter, PaginatedInfrastructureFilter


def apply_infrastructure_filters(
    stmt: Select, filters: InfrastructureFilter | PaginatedInfrastructureFilter
) -> Select:
    """Apply the shared type/quarter/status criteria to any Infrastructure-based query.

    Shared by the infrastructures and stats routers so the two endpoints can
    never drift out of sync on what "the active filters" means.
    """
    if filters.selected_types:
        stmt = stmt.where(Infrastructure.type_id.in_(filters.selected_types))
    if filters.selected_quarters:
        stmt = stmt.where(Infrastructure.quartier_id.in_(filters.selected_quarters))
    if isinstance(filters, InfrastructureFilter) and filters.selected_statuses:
        stmt = stmt.where(Infrastructure.status_id.in_(filters.selected_statuses))
    return stmt
