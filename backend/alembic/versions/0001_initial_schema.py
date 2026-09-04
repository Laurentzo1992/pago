"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-09-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "communes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nom_commune", sa.String(length=30), nullable=True, unique=True),
    )

    op.create_table(
        "arrondissements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nom_arrondissement", sa.String(length=30), nullable=True),
        sa.Column("commune_id", sa.Integer(), sa.ForeignKey("communes.id", ondelete="CASCADE"), nullable=True),
        sa.UniqueConstraint("nom_arrondissement", "commune_id"),
    )

    op.create_table(
        "secteurs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nom_secteur", sa.String(length=30), nullable=True),
        sa.Column(
            "arrondissement_id", sa.Integer(), sa.ForeignKey("arrondissements.id", ondelete="CASCADE"), nullable=True
        ),
        sa.UniqueConstraint("nom_secteur", "arrondissement_id"),
    )

    op.create_table(
        "quartiers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nom_quartier", sa.String(length=60), nullable=True),
        sa.Column("secteur_id", sa.Integer(), sa.ForeignKey("secteurs.id", ondelete="CASCADE"), nullable=True),
        sa.UniqueConstraint("nom_quartier", "secteur_id"),
    )

    op.create_table(
        "types",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("type", sa.String(length=200), nullable=True),
        sa.Column("parent_id", sa.Integer(), sa.ForeignKey("types.id", ondelete="CASCADE"), nullable=True),
        sa.UniqueConstraint("type", "parent_id"),
    )

    op.create_table(
        "statuses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("status", sa.String(length=30), nullable=True),
    )

    op.create_table(
        "repondants",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=30), nullable=True),
        sa.Column("contact", sa.String(length=30), nullable=True),
        sa.Column("qualite", sa.String(length=30), nullable=True),
    )

    op.create_table(
        "infrastructures",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nom", sa.String(length=300), nullable=True),
        sa.Column("type_id", sa.Integer(), sa.ForeignKey("types.id", ondelete="CASCADE"), nullable=True),
        sa.Column("quartier_id", sa.Integer(), sa.ForeignKey("quartiers.id", ondelete="CASCADE"), nullable=True),
        sa.Column("status_id", sa.Integer(), sa.ForeignKey("statuses.id", ondelete="CASCADE"), nullable=True),
        sa.Column("repondant_id", sa.Integer(), sa.ForeignKey("repondants.id", ondelete="CASCADE"), nullable=True),
        sa.Column("etat_voie", sa.String(length=200), nullable=True),
        sa.Column("emplacement", sa.String(length=200), nullable=True),
        sa.Column("cloture", sa.String(length=200), nullable=True),
        sa.Column("accessibilite", sa.String(length=200), nullable=True),
        sa.Column("etat", sa.String(length=200), nullable=True),
        sa.Column("latitude", sa.String(length=30), nullable=True),
        sa.Column("longitude", sa.String(length=30), nullable=True),
        sa.Column("altitude", sa.String(length=30), nullable=True),
        sa.Column("precision", sa.String(length=30), nullable=True),
    )

    op.create_table(
        "guides",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("file", sa.String(length=255), nullable=True),
    )

    op.create_table(
        "legends",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("type_id", sa.Integer(), sa.ForeignKey("types.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("image", sa.String(length=255), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("legends")
    op.drop_table("guides")
    op.drop_table("infrastructures")
    op.drop_table("repondants")
    op.drop_table("statuses")
    op.drop_table("types")
    op.drop_table("quartiers")
    op.drop_table("secteurs")
    op.drop_table("arrondissements")
    op.drop_table("communes")
