"""Data migration for the PAGO FastAPI backend.

Ports the logic of the original Django management commands
(insert_types, insert_locations, insert_status, insert_infrastructures)
to SQLAlchemy, reading from the same source spreadsheets
(scripts/data/data.xlsx and scripts/data/Categories.xlsx).

Usage:
    python -m scripts.migrate_data
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

from app.database import SessionLocal
from app.models import Arrondissement, Commune, Infrastructure, Quartier, Secteur, Status, Type
from scripts.seed_utils import get_or_create

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_XLSX = DATA_DIR / "data.xlsx"
CATEGORIES_XLSX = DATA_DIR / "Categories.xlsx"
SHEET_NAME = "BASE DES DONNEES DU PAGO"

# Column holding the subcategory, keyed by top-level "type d'infrastructure" category.
# Mirrors webmapping/management/commands/insert_types.py and insert_infrastructures.py.
CATEGORY_SUBCATEGORY_COLUMNS = {
    "INFRASTRUCTURES MARCHANDS": "Q2.1. Type d’infrastructures marchands",
    "CIMETIRE": "Q13.1. Etat du cimetière",
    "EAU ET ASSAINISSEMENT": "Q9.2. Quel est la nature de l’infrastructure ?",
    "EQUIPEMENT SOCIO CULTUREL / LOISIRS": "Q3.1. Type d’infrastructures socio culturel",
    "ESPACES VERTS": "Q7.1. Types d’espaces",
    "INFRASTRUCTURES ADMINISTRATIVE": "Q8.1. Quel est le type d’infrastructure",
    "INFRASTRUCTURES DE CONSERVATIONS": "Q11.6. Quelle est l’utilité de l’infrastructure",
    "INFRASTRUCTURES EDUCATIVES": "Q1.1. Établissement",
    "INFRASTRUTURES TOURISTIQUES": "Q6.1. Type d’infrastructures touristiques   :",
    "INFRASTURCTURES SANITAIRES": "Q4.1. Type d’infrastructures sanitaire",
    "INFRASTURCTURES SPORTIVES": "Q5.1. Type d’infrastructures sportives",
    "LES UNITES INDUSTRIELLES ET LES USINES": "Q12.1. Quel est le type d’infrastructure",
    "LIEUX DE CULTE": "Q10.1.  Type du lieu de culte ?",
}


def _regroupement_name(dfc: pd.DataFrame, category: str, subcategory) -> str:
    if not dfc["Type"].isin([subcategory]).any():
        return category
    criteria = (dfc["Thematiques"] == category) & (dfc["Type"] == subcategory)
    names = dfc[criteria]["Regroupement"].values
    return category if len(names) < 1 else names[0]


def insert_types(db, df: pd.DataFrame, dfc: pd.DataFrame) -> None:
    print("Inserting types...")
    categories = df["I11. Type de l'infrastructure"].fillna("Autres").unique().tolist()

    for category in categories:
        print(f"  {category}")
        root, _ = get_or_create(db, Type, type=category, parent_id=None)

        subcategory_column = CATEGORY_SUBCATEGORY_COLUMNS.get(category)
        if subcategory_column is None:
            continue

        criteria = df["I11. Type de l'infrastructure"] == category
        subcategories = df[criteria][subcategory_column].fillna("N/A").unique().tolist()

        for subcategory in subcategories:
            regroupement_name = _regroupement_name(dfc, category, subcategory)
            print(f"    {regroupement_name} --> {subcategory}")

            regroupement, _ = get_or_create(db, Type, type=regroupement_name, parent_id=root.id)
            get_or_create(db, Type, type=subcategory, parent_id=regroupement.id)

    db.commit()


def insert_locations(db, df: pd.DataFrame) -> None:
    print("Inserting locations...")
    communes = df["I2. Commune"].fillna("").unique().tolist()

    for commune_name in communes:
        crit_commune = df["I2. Commune"].fillna("") == commune_name
        arr_villages = df[crit_commune]["II3. arrondissement/Village"].fillna("").unique().tolist()

        commune, _ = get_or_create(db, Commune, nom_commune=commune_name)
        print(f"  {commune_name}")

        for arr_village in arr_villages:
            crit_arr = crit_commune & (df["II3. arrondissement/Village"].fillna("") == arr_village)
            secteurs = df[crit_arr]["I4. Secteur"].fillna("N/A").unique().tolist()

            arrondissement, _ = get_or_create(
                db, Arrondissement, nom_arrondissement=arr_village, commune_id=commune.id
            )
            print(f"    - {arr_village}")

            for secteur_name in secteurs:
                crit_secteur = crit_arr & (df["I4. Secteur"].fillna("N/A") == secteur_name)
                quartiers = df[crit_secteur]["I4. Nom du quartier"].fillna("").unique().tolist()

                secteur, _ = get_or_create(db, Secteur, nom_secteur=secteur_name, arrondissement_id=arrondissement.id)
                print(f"      - {secteur_name}")

                for quartier_name in quartiers:
                    get_or_create(db, Quartier, nom_quartier=quartier_name, secteur_id=secteur.id)
                    print(f"        - {quartier_name}")

    db.commit()


def insert_status(db, df: pd.DataFrame) -> None:
    print("Inserting statuses...")
    statuses = df["I10. Statut de l'infrastructure"].dropna().unique().tolist()
    for status_value in statuses:
        get_or_create(db, Status, status=status_value)
        print(f"  {status_value}")
    db.commit()


def _na_or(row, column):
    """Read a cell, mirroring the original commands' `'N/A' if pd.isna(...) else ...`.

    All the target columns are String in our schema (matching the original
    CharFields), but pandas reads numeric-looking columns (e.g. the GPS
    coordinates) as floats - stringify explicitly so they compare/insert
    cleanly against VARCHAR columns.
    """
    value = row[column]
    if pd.isna(value):
        return "N/A"
    return str(value)


def insert_infrastructures(db, df: pd.DataFrame, dfc: pd.DataFrame) -> None:
    print("Inserting infrastructures...")
    exceeds = []
    errors = []
    total_rows = df.shape[0]

    for index, row in df.iterrows():
        category = "Autres" if pd.isna(row["I11. Type de l'infrastructure"]) else row["I11. Type de l'infrastructure"]
        subcategory_column = CATEGORY_SUBCATEGORY_COLUMNS.get(category)
        subcategory = _na_or(row, subcategory_column) if subcategory_column else "N/A"

        commune_name = "" if pd.isna(row["I2. Commune"]) else row["I2. Commune"]
        arrondissement_name = "" if pd.isna(row["II3. arrondissement/Village"]) else row["II3. arrondissement/Village"]
        secteur_name = _na_or(row, "I4. Secteur")
        quartier_name = "" if pd.isna(row["I4. Nom du quartier"]) else row["I4. Nom du quartier"]
        status_value = _na_or(row, "I10. Statut de l'infrastructure")
        nom_infra = _na_or(row, "I9. Nom de l'infrastructure")

        regroupement_names = dfc[(dfc["Type"] == subcategory) & (dfc["Thematiques"] == category)]["Regroupement"].values
        if len(regroupement_names) > 1:
            exceeds.append([index, category, subcategory, regroupement_names])
        regroupement_name = _regroupement_name(dfc, category, subcategory)

        try:
            thematique = db.query(Type).filter_by(type=category, parent_id=None).one()
            regroupement = db.query(Type).filter_by(type=regroupement_name, parent_id=thematique.id).one()
            typee = db.query(Type).filter_by(type=subcategory, parent_id=regroupement.id).first()

            commune = db.query(Commune).filter_by(nom_commune=commune_name).one()
            arrondissement = (
                db.query(Arrondissement)
                .filter_by(nom_arrondissement=arrondissement_name, commune_id=commune.id)
                .one()
            )
            secteur = db.query(Secteur).filter_by(nom_secteur=secteur_name, arrondissement_id=arrondissement.id).one()
            quartier = db.query(Quartier).filter_by(nom_quartier=quartier_name, secteur_id=secteur.id).one()
            status = db.query(Status).filter_by(status=status_value).one()
        except Exception as exc:  # noqa: BLE001 - mirrors the original command's broad catch + log
            print(str(exc))
            print(f"{index + 1}/{total_rows} (Error): {category} --> {regroupement_name} --> {subcategory} --> {nom_infra}")
            print(commune_name, arrondissement_name, secteur_name, quartier_name)
            errors.append([index, category, subcategory, nom_infra])
            continue

        # Mirrors the original command: every field below was passed directly
        # to Django's get_or_create(**kwargs), which uses ALL of them as the
        # match criteria (none were wrapped in `defaults=`) - so a row only
        # counts as a duplicate if every one of these values matches exactly.
        infrastructure, _ = get_or_create(
            db,
            Infrastructure,
            nom=nom_infra,
            type_id=typee.id if typee else None,
            quartier_id=quartier.id,
            status_id=status.id,
            etat_voie=_na_or(row, "Q2.8. Quel est l’état de la voie ?"),
            emplacement=_na_or(row, "Q2.7. Emplacement de l’infrastructures par rapport à la voie"),
            cloture=_na_or(row, "Q2.3. Clôture (les lieux sont-ils entourés de mûr, grilles, etc.)"),
            accessibilite=_na_or(row, "Q1.7. Accessibilité :"),
            etat=_na_or(row, "Q1.3. État du bâtiment"),
            latitude=_na_or(row, "_IY1. Coordonnées géographiques_latitude"),
            longitude=_na_or(row, "_IY1. Coordonnées géographiques_longitude"),
            altitude=_na_or(row, "_IY1. Coordonnées géographiques_altitude"),
            precision=_na_or(row, "_IY1. Coordonnées géographiques_precision"),
        )
        print(f"{index + 1}/{total_rows}: {category} --> {regroupement_name} --> {subcategory} --> {infrastructure.nom}")

    db.commit()

    if exceeds:
        print("Rows matching more than one regroupement:")
        print(exceeds)
    if errors:
        print(f"{len(errors)} row(s) skipped due to missing reference data:")
        print(errors)


def run() -> None:
    if not DATA_XLSX.exists() or not CATEGORIES_XLSX.exists():
        raise SystemExit(f"Expected {DATA_XLSX} and {CATEGORIES_XLSX} to exist.")

    df = pd.read_excel(DATA_XLSX, sheet_name=SHEET_NAME)
    dfc = pd.read_excel(CATEGORIES_XLSX, sheet_name="data")

    db = SessionLocal()
    try:
        insert_types(db, df, dfc)
        insert_locations(db, df)
        insert_status(db, df)
        insert_infrastructures(db, df, dfc)
    finally:
        db.close()

    print("Done.")
    print(
        "Note: Legend and Guide rows are not part of the source spreadsheets "
        "(they were created by hand in the old Django admin). The underlying "
        "files were copied to backend/media/legend_images and "
        "backend/media/uploads_files, but the Legend/Guide database rows "
        "linking them to a Type must be recreated manually via /admin."
    )


if __name__ == "__main__":
    run()
