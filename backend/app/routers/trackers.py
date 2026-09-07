from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Tracker, TrackerPosition
from app.schemas import TrackerOut, TrackerPositionIn

router = APIRouter()


def _record_position(db: Session, api_key: str, lat: float, lng: float, accuracy: float | None) -> None:
    tracker = db.execute(select(Tracker).where(Tracker.api_key == api_key)).scalar_one_or_none()
    if tracker is None:
        raise HTTPException(status_code=404, detail="Unknown tracker")

    db.add(TrackerPosition(tracker_id=tracker.id, lat=lat, lng=lng, accuracy=accuracy))
    tracker.last_lat = lat
    tracker.last_lng = lng
    tracker.last_accuracy = accuracy
    tracker.last_seen_at = datetime.now(timezone.utc)
    db.commit()


@router.get("/api/trackers", response_model=list[TrackerOut])
def get_trackers(db: Session = Depends(get_db)):
    return db.execute(select(Tracker)).scalars().all()


@router.post("/api/trackers/{api_key}/positions", status_code=201)
def report_tracker_position(api_key: str, payload: TrackerPositionIn, db: Session = Depends(get_db)):
    """For a custom/DIY device (or any client) able to POST a small JSON body."""
    _record_position(db, api_key, payload.lat, payload.lng, payload.accuracy)
    return {"status": "ok"}


@router.get("/api/trackers/positions")
def report_tracker_position_osmand(
    id: str,
    lat: float,
    lon: float,
    hdop: float | None = None,
    db: Session = Depends(get_db),
):
    """OsmAnd-protocol-compatible endpoint, for the official Traccar Client
    app (Android/iOS) - point its "Server URL" at .../api/trackers/positions
    and its "Device Identifier" at a tracker's api_key. No app-side JSON
    configuration needed, unlike report_tracker_position above.
    """
    _record_position(db, id, lat, lon, hdop)
    return {"status": "ok"}
