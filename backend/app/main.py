from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.admin import register_admin
from app.config import settings
from app.database import engine
from app.routers import guides, infrastructures, locations, status, types

app = FastAPI(title="PAGO API")

app.add_middleware(SessionMiddleware, secret_key=settings.secret_key)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(settings.media_url, StaticFiles(directory=settings.media_root), name="media")

app.include_router(types.router)
app.include_router(locations.router)
app.include_router(status.router)
app.include_router(infrastructures.router)
app.include_router(guides.router)

register_admin(app, engine)


@app.get("/api/health")
def health():
    return {"status": "ok"}
