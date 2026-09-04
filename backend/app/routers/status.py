from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Status
from app.schemas import StatusOut

router = APIRouter()


@router.get("/api/status", response_model=list[StatusOut])
def get_statuses(db: Session = Depends(get_db)):
    return db.execute(select(Status)).scalars().all()
