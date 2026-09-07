"""Convert the GIS shapefiles under backend/Données/ (EPSG:32630 / UTM 30N)
into WGS84 GeoJSON files served as static map overlays.

The shapefiles are exports from ArcGIS/QGIS and mix a few quirks (duplicate
`~BROMIUM` sandbox-software copies, two merged survey schemas for the roads
layer, cryptic taxonomy codes with no lookup table) that this script works
around - see the field-selection logic per layer below.

Usage:
    python -m scripts.convert_shapefiles
"""
from __future__ import annotations

import json
from pathlib import Path

import shapefile
from pyproj import Transformer

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "scripts" / "data" / "geo"
OUT_DIR = BASE_DIR / "app" / "geo_static"

# WGS 84 / UTM zone 30N. Confirmed via every source .prj that has one; the
# two files that ship without a .prj (Voirie_bitumée_Ouaga, Carrefour_à_feu_
# tricolor) were validated independently instead - their reprojected points
# land within ~20m of the lat/lon already recorded in their own attribute
# table, so the same CRS assumption holds for them too.
SOURCE_CRS = "EPSG:32630"
TARGET_CRS = "EPSG:4326"

transformer = Transformer.from_crs(SOURCE_CRS, TARGET_CRS, always_xy=True)


def _reproject_coords(coords):
    if isinstance(coords[0], (int, float)):
        lon, lat = transformer.transform(coords[0], coords[1])
        return [round(lon, 6), round(lat, 6)]
    return [_reproject_coords(c) for c in coords]


def _shape_to_geometry(shape) -> dict:
    geometry = dict(shape.__geo_interface__)
    geometry["coordinates"] = _reproject_coords(geometry["coordinates"])
    return geometry


def _na(value):
    """Shapefiles use '' or 0 as their null - normalize to None for GeoJSON."""
    if value in (None, "", 0, "0"):
        return None
    return value


def _clean_ardt(value):
    if not value:
        return None
    return " ".join(value.replace(".", ". ").split()).replace(". .", ".").strip()


def _build_feature_collection(shp_path: Path, prop_fn) -> dict:
    sf = shapefile.Reader(str(shp_path))
    features = []
    for shape_record in sf.shapeRecords():
        if not shape_record.shape.points:
            continue
        record = dict(shape_record.record.as_dict())
        features.append(
            {
                "type": "Feature",
                "geometry": _shape_to_geometry(shape_record.shape),
                "properties": prop_fn(record),
            }
        )
    return {"type": "FeatureCollection", "features": features}


def _write(name: str, feature_collection: dict) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{name}.geojson"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(feature_collection, f, ensure_ascii=False, separators=(",", ":"))
    size_kb = out_path.stat().st_size / 1024
    print(f"{name}: {len(feature_collection['features'])} features -> {out_path.name} ({size_kb:.1f} KB)")


def _voirie_props(d: dict) -> dict:
    # Voirie_bitumée_Ouaga.shp merges two survey batches with different
    # schemas (old: Odonyme__O/Type__TYP_/... , new: NOM/TYPE/... with
    # abbreviation codes and no decode table) - coalesce, preferring the
    # human-readable old schema where both are present.
    return {
        "nom": _na(d.get("Odonyme__O")) or _na(d.get("NOM")),
        "type": _na(d.get("Type__TYP_")) or _na(d.get("TYPE")),
        "revetement": _na(d.get("Revêtemen")) or _na(d.get("REVETEMENT")),
        "eclairage": _na(d.get("Eclairage_")) or _na(d.get("ECLAIRAGE")),
        "piste_cyclable": _na(d.get("Piste_cycl")),
        "arrondissement": _na(d.get("ARDT")),
    }


def run() -> None:
    shp_dir = DATA_DIR / "SHP Ouaga_Limite_vegetation_barrage"
    voirie_dir = DATA_DIR / "Voirie_bitumee"

    _write(
        "arrondissements",
        _build_feature_collection(shp_dir / "Limite_arrondt.shp", lambda d: {"nom": _clean_ardt(_na(d.get("NOM_ARROND")))}),
    )

    _write(
        "secteurs",
        _build_feature_collection(
            shp_dir / "Limite_secteur.shp",
            lambda d: {
                "nom": _na(d.get("NOM_SECETE")),
                "arrondissement": _clean_ardt(_na(d.get("NOM_ARROND"))),
                "population_totale": _na(d.get("Pop_total")),
                "hommes": _na(d.get("Home")),
                "femmes": _na(d.get("Feme")),
                "pourcentage_femmes": round(d["Prtg_Femme"], 1) if _na(d.get("Prtg_Femme")) else None,
                "superficie_ha": round(d["Sup_secteu"], 1) if _na(d.get("Sup_secteu")) else None,
                "densite_hab_ha": round(d["Densite"], 1) if _na(d.get("Densite")) else None,
            },
        ),
    )

    _write(
        "quartiers",
        _build_feature_collection(
            shp_dir / "Nom_des_quartiers.shp",
            lambda d: {"nom": _na(d.get("Nom__NOM_L")), "nature": _na(d.get("Nature__NA"))},
        ),
    )

    _write(
        "vegetation",
        _build_feature_collection(shp_dir / "Végétation.shp", lambda d: {"nom": _na(d.get("NOM")) or "Espace vert"}),
    )

    # No name field in the source data for the single dam/reservoir polygon.
    _write("barrage", _build_feature_collection(shp_dir / "Barrage.shp", lambda d: {"nom": "Barrage / plan d'eau"}))

    _write("voirie", _build_feature_collection(voirie_dir / "Voirie_bitumée_Ouaga.shp", _voirie_props))

    _write(
        "carrefours",
        _build_feature_collection(
            voirie_dir / "Carrefour_à_feu_tricolor.shp",
            lambda d: {
                "designation": _na(d.get("Désignati")) or "Carrefour à feux",
                "rue_1": _na(d.get("Rue_1")),
                "rue_2": _na(d.get("Rue_2")),
                "etat": _na(d.get("Etat_signa")),
            },
        ),
    )

    print("Done.")


if __name__ == "__main__":
    run()
