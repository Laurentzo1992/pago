from __future__ import annotations

import hmac
import uuid
from pathlib import Path

import bcrypt
from markupsafe import Markup
from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse
from wtforms import FileField
from wtforms.validators import Optional as OptionalValidator

from app.config import BASE_DIR, settings
from app.models import (
    Arrondissement,
    Commune,
    Guide,
    Infrastructure,
    Legend,
    Quartier,
    Repondant,
    Secteur,
    Status,
    Type,
)


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username, password = form.get("username"), form.get("password")

        if not settings.admin_password_hash or not hmac.compare_digest(
            (username or "").encode(), settings.admin_username.encode()
        ):
            return False
        try:
            valid = bcrypt.checkpw((password or "").encode(), settings.admin_password_hash.encode())
        except ValueError:
            valid = False
        if not valid:
            return False

        request.session.update({"admin_authenticated": True})
        return True

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool | RedirectResponse:
        if not request.session.get("admin_authenticated"):
            return RedirectResponse(request.url_for("admin:login"), status_code=302)
        return True


def _save_upload(upload, subdir: str) -> str | None:
    """Save an uploaded werkzeug/starlette file to MEDIA_ROOT/subdir, return the relative path."""
    if not upload or not getattr(upload, "filename", None):
        return None

    ext = Path(upload.filename).suffix
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_dir = settings.media_root / subdir
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / filename

    dest_path.write_bytes(upload.file.read())
    return f"{subdir}/{filename}"


class CommuneAdmin(ModelView, model=Commune):
    column_list = [Commune.id, Commune.nom_commune]
    name_plural = "Communes"


class ArrondissementAdmin(ModelView, model=Arrondissement):
    column_list = [Arrondissement.id, Arrondissement.nom_arrondissement, Arrondissement.commune]
    name_plural = "Arrondissements"


class SecteurAdmin(ModelView, model=Secteur):
    column_list = [Secteur.id, Secteur.nom_secteur, Secteur.arrondissement]
    page_size = 10
    name_plural = "Secteurs"


class QuartierAdmin(ModelView, model=Quartier):
    column_list = [Quartier.id, Quartier.nom_quartier, Quartier.secteur]
    name_plural = "Quartiers"


class TypeAdmin(ModelView, model=Type):
    column_list = [Type.id, Type.type, Type.parent]
    name_plural = "Types d'infrastructure"


class StatusAdmin(ModelView, model=Status):
    column_list = [Status.id, Status.status]
    name_plural = "Statuts"


class RepondantAdmin(ModelView, model=Repondant):
    column_list = [Repondant.id, Repondant.name, Repondant.contact, Repondant.qualite]
    name_plural = "Répondants"


class InfrastructureAdmin(ModelView, model=Infrastructure):
    column_list = [
        Infrastructure.id,
        Infrastructure.nom,
        Infrastructure.type,
        Infrastructure.quartier,
        Infrastructure.status,
    ]
    page_size = 10
    name_plural = "Infrastructures"


def _format_guide_link(obj, attr) -> Markup | str:
    if not obj.file:
        return ""
    return Markup(f'<a href="{settings.media_url}/{obj.file}" target="_blank">{obj.file}</a>')


def _format_legend_thumb(obj, attr) -> Markup | str:
    if not obj.image:
        return ""
    return Markup(f'<img src="{settings.media_url}/{obj.image}" style="max-width:32px;max-height:32px;" />')


class GuideAdmin(ModelView, model=Guide):
    column_list = [Guide.id, Guide.file]
    column_formatters = {Guide.file: _format_guide_link}
    # sqladmin has no Flask-Admin-style form_extra_fields: to get a file input
    # we override the WTForms field used for the existing `file` column itself.
    form_overrides = {"file": FileField}
    form_args = {"file": {"validators": [OptionalValidator()]}}
    name_plural = "Guides"

    async def on_model_change(self, data: dict, model: Guide, is_created: bool, request: Request) -> None:
        saved_path = _save_upload(data.get("file"), "uploads_files")
        if saved_path:
            data["file"] = saved_path
        elif not is_created:
            data["file"] = model.file
        else:
            data["file"] = None


class LegendAdmin(ModelView, model=Legend):
    column_list = [Legend.id, Legend.type, Legend.description, Legend.image]
    column_formatters = {Legend.image: _format_legend_thumb}
    form_overrides = {"image": FileField}
    form_args = {"image": {"label": "Image (max 32x32px)", "validators": [OptionalValidator()]}}
    name_plural = "Légendes"
    name = "Légende"

    async def on_model_change(self, data: dict, model: Legend, is_created: bool, request: Request) -> None:
        saved_path = _save_upload(data.get("image"), "legend_images")
        if saved_path:
            data["image"] = saved_path
        elif not is_created:
            data["image"] = model.image
        elif not data.get("image"):
            raise ValueError("Une image est requise pour créer une légende.")


def register_admin(app, engine) -> Admin:
    admin = Admin(
        app,
        engine,
        authentication_backend=AdminAuth(secret_key=settings.secret_key),
        title="PAGO Admin",
        logo_url="/admin-static/logo.png",
        favicon_url="/admin-static/logo.png",
        templates_dir=str(BASE_DIR / "app" / "admin_templates"),
    )

    for view in [
        CommuneAdmin,
        ArrondissementAdmin,
        SecteurAdmin,
        QuartierAdmin,
        TypeAdmin,
        StatusAdmin,
        RepondantAdmin,
        InfrastructureAdmin,
        GuideAdmin,
        LegendAdmin,
    ]:
        admin.add_view(view)

    return admin
