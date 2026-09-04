from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Guide
from app.schemas import GuideOut

router = APIRouter()


@router.get("/api/guides", response_model=list[GuideOut])
def get_guides(db: Session = Depends(get_db)):
    guides = db.execute(select(Guide)).scalars().all()
    return [
        GuideOut(id=g.id, file=g.file, url=f"{settings.media_url}/{g.file}" if g.file else None)
        for g in guides
    ]
