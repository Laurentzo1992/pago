from __future__ import annotations

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Commune(Base):
    __tablename__ = "communes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom_commune: Mapped[str | None] = mapped_column(String(30), unique=True, nullable=True)

    arrondissements: Mapped[list["Arrondissement"]] = relationship(
        back_populates="commune", cascade="all, delete-orphan"
    )

    def __str__(self) -> str:
        return self.nom_commune or ""


class Arrondissement(Base):
    __tablename__ = "arrondissements"
    __table_args__ = (UniqueConstraint("nom_arrondissement", "commune_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    nom_arrondissement: Mapped[str | None] = mapped_column(String(30), nullable=True)
    commune_id: Mapped[int | None] = mapped_column(ForeignKey("communes.id", ondelete="CASCADE"), nullable=True)

    commune: Mapped[Commune | None] = relationship(back_populates="arrondissements")
    secteurs: Mapped[list["Secteur"]] = relationship(back_populates="arrondissement", cascade="all, delete-orphan")

    def __str__(self) -> str:
        return self.nom_arrondissement or ""


class Secteur(Base):
    __tablename__ = "secteurs"
    __table_args__ = (UniqueConstraint("nom_secteur", "arrondissement_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    nom_secteur: Mapped[str | None] = mapped_column(String(30), nullable=True)
    arrondissement_id: Mapped[int | None] = mapped_column(
        ForeignKey("arrondissements.id", ondelete="CASCADE"), nullable=True
    )

    arrondissement: Mapped[Arrondissement | None] = relationship(back_populates="secteurs")
    quartiers: Mapped[list["Quartier"]] = relationship(back_populates="secteur", cascade="all, delete-orphan")

    def __str__(self) -> str:
        return self.nom_secteur or ""


class Quartier(Base):
    __tablename__ = "quartiers"
    __table_args__ = (UniqueConstraint("nom_quartier", "secteur_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    nom_quartier: Mapped[str | None] = mapped_column(String(60), nullable=True)
    secteur_id: Mapped[int | None] = mapped_column(ForeignKey("secteurs.id", ondelete="CASCADE"), nullable=True)

    secteur: Mapped[Secteur | None] = relationship(back_populates="quartiers")

    def __str__(self) -> str:
        return self.nom_quartier or ""


class Type(Base):
    """Infrastructure category tree (adjacency list, replaces django-mptt)."""

    __tablename__ = "types"
    __table_args__ = (UniqueConstraint("type", "parent_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str | None] = mapped_column(String(200), nullable=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("types.id", ondelete="CASCADE"), nullable=True)

    parent: Mapped["Type | None"] = relationship(remote_side=[id], back_populates="children")
    children: Mapped[list["Type"]] = relationship(back_populates="parent", cascade="all, delete-orphan")
    legend: Mapped["Legend | None"] = relationship(back_populates="type", uselist=False)

    def __str__(self) -> str:
        return self.type or ""


class Status(Base):
    __tablename__ = "statuses"

    id: Mapped[int] = mapped_column(primary_key=True)
    status: Mapped[str | None] = mapped_column(String(30), nullable=True)

    def __str__(self) -> str:
        return self.status or ""


class Repondant(Base):
    __tablename__ = "repondants"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str | None] = mapped_column(String(30), nullable=True)
    contact: Mapped[str | None] = mapped_column(String(30), nullable=True)
    qualite: Mapped[str | None] = mapped_column(String(30), nullable=True)

    def __str__(self) -> str:
        return self.name or ""


class Infrastructure(Base):
    __tablename__ = "infrastructures"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str | None] = mapped_column(String(300), nullable=True)

    type_id: Mapped[int | None] = mapped_column(ForeignKey("types.id", ondelete="CASCADE"), nullable=True)
    quartier_id: Mapped[int | None] = mapped_column(ForeignKey("quartiers.id", ondelete="CASCADE"), nullable=True)
    status_id: Mapped[int | None] = mapped_column(ForeignKey("statuses.id", ondelete="CASCADE"), nullable=True)
    repondant_id: Mapped[int | None] = mapped_column(ForeignKey("repondants.id", ondelete="CASCADE"), nullable=True)

    etat_voie: Mapped[str | None] = mapped_column(String(200), nullable=True)
    emplacement: Mapped[str | None] = mapped_column(String(200), nullable=True)
    cloture: Mapped[str | None] = mapped_column(String(200), nullable=True)
    accessibilite: Mapped[str | None] = mapped_column(String(200), nullable=True)
    etat: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Kept as strings (not numeric) on purpose: source spreadsheets sometimes
    # contain "N/A" in these columns instead of a coordinate.
    latitude: Mapped[str | None] = mapped_column(String(30), nullable=True)
    longitude: Mapped[str | None] = mapped_column(String(30), nullable=True)
    altitude: Mapped[str | None] = mapped_column(String(30), nullable=True)
    precision: Mapped[str | None] = mapped_column(String(30), nullable=True)

    type: Mapped[Type | None] = relationship()
    quartier: Mapped[Quartier | None] = relationship()
    status: Mapped[Status | None] = relationship()
    repondant: Mapped[Repondant | None] = relationship()

    def __str__(self) -> str:
        return self.nom or ""


class Guide(Base):
    __tablename__ = "guides"

    id: Mapped[int] = mapped_column(primary_key=True)
    file: Mapped[str | None] = mapped_column(String(255), nullable=True)

    def __str__(self) -> str:
        return self.file or ""


class Legend(Base):
    __tablename__ = "legends"

    id: Mapped[int] = mapped_column(primary_key=True)
    type_id: Mapped[int] = mapped_column(ForeignKey("types.id", ondelete="CASCADE"), unique=True)
    description: Mapped[str] = mapped_column(Text)
    image: Mapped[str] = mapped_column(String(255))

    type: Mapped[Type] = relationship(back_populates="legend")

    def __str__(self) -> str:
        return self.type.type if self.type else ""
