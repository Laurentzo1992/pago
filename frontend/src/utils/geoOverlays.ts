declare const L: typeof import("leaflet");

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function fmtNumber(value: unknown): string {
  return typeof value === "number" ? value.toLocaleString("fr-FR") : "N/A";
}

async function fetchGeoJSON(name: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/geo/${name}.geojson`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetches the GIS reference layers (administrative boundaries, vegetation,
 * the reservoir, paved roads, traffic lights, quartier labels) and registers
 * them as toggleable overlays on an existing layers control. All start
 * unchecked so the map stays uncluttered by default.
 */
export async function loadGeoOverlays(map: L.Map, layersControl: L.Control.Layers) {
  const [arrondissements, secteurs, quartiers, vegetation, barrage, voirie, carrefours] = await Promise.all([
    fetchGeoJSON("arrondissements"),
    fetchGeoJSON("secteurs"),
    fetchGeoJSON("quartiers"),
    fetchGeoJSON("vegetation"),
    fetchGeoJSON("barrage"),
    fetchGeoJSON("voirie"),
    fetchGeoJSON("carrefours"),
  ]);

  if (arrondissements) {
    const layer = L.geoJSON(arrondissements, {
      style: { color: "#123f30", weight: 2.5, fillOpacity: 0, dashArray: "5 4" },
      onEachFeature: (feature, l) => l.bindPopup(`<b>${feature.properties?.nom ?? "Arrondissement"}</b>`),
    });
    layersControl.addOverlay(layer, "Arrondissements");
  }

  if (secteurs) {
    const layer = L.geoJSON(secteurs, {
      style: { color: "#1b5e46", weight: 1, fillOpacity: 0.04, fillColor: "#1b5e46" },
      onEachFeature: (feature, l) => {
        const p = feature.properties ?? {};
        l.bindPopup(
          `<b>${p.nom ?? "Secteur"}</b> &mdash; ${p.arrondissement ?? ""}<br>` +
            `Population : ${fmtNumber(p.population_totale)} (${fmtNumber(p.hommes)} H / ${fmtNumber(p.femmes)} F)<br>` +
            `Superficie : ${fmtNumber(p.superficie_ha)} ha &mdash; Densité : ${fmtNumber(p.densite_hab_ha)} hab/ha`,
        );
      },
    });
    layersControl.addOverlay(layer, "Secteurs (population)");
  }

  if (vegetation) {
    const layer = L.geoJSON(vegetation, {
      style: { color: "#2e7d32", weight: 1, fillOpacity: 0.35, fillColor: "#4caf50" },
      onEachFeature: (feature, l) => l.bindPopup(`<b>${feature.properties?.nom ?? "Espace vert"}</b>`),
    });
    layersControl.addOverlay(layer, "Végétation");
  }

  if (barrage) {
    const layer = L.geoJSON(barrage, {
      style: { color: "#0d47a1", weight: 1, fillOpacity: 0.45, fillColor: "#1976d2" },
      onEachFeature: (feature, l) => l.bindPopup(`<b>${feature.properties?.nom ?? "Plan d'eau"}</b>`),
    });
    layersControl.addOverlay(layer, "Barrage");
  }

  if (voirie) {
    const layer = L.geoJSON(voirie, {
      style: { color: "#4a5568", weight: 2, opacity: 0.85 },
      onEachFeature: (feature, l) => {
        const p = feature.properties ?? {};
        const rows = [
          `<b>${p.nom ?? p.type ?? "Voie"}</b>`,
          p.type ? `Type : ${p.type}` : null,
          p.revetement ? `Revêtement : ${p.revetement}` : null,
          p.eclairage ? `Éclairage : ${p.eclairage}` : null,
          p.piste_cyclable ? `Piste cyclable : ${p.piste_cyclable}` : null,
        ].filter(Boolean);
        l.bindPopup(rows.join("<br>"));
      },
    });
    layersControl.addOverlay(layer, "Voirie bitumée");
  }

  if (carrefours) {
    const layer = L.geoJSON(carrefours, {
      pointToLayer: (_feature, latlng) =>
        L.circleMarker(latlng, { radius: 5, color: "#fff", weight: 1, fillColor: "#dc2626", fillOpacity: 0.9 }),
      onEachFeature: (feature, l) => {
        const p = feature.properties ?? {};
        l.bindPopup(`<b>${p.designation ?? "Carrefour à feux"}</b><br>${p.rue_1 ?? ""}<br>${p.rue_2 ?? ""}`);
      },
    });
    layersControl.addOverlay(layer, "Carrefours à feux");
  }

  if (quartiers) {
    const layer = L.geoJSON(quartiers, {
      pointToLayer: (feature, latlng) =>
        L.marker(latlng, {
          icon: L.divIcon({ className: "pago-quartier-label", html: "", iconSize: [0, 0] }),
        }).bindTooltip(feature.properties?.nom ?? "", { permanent: true, direction: "center", className: "pago-quartier-tooltip" }),
    });

    // Keep the label layer out of the way at low zoom levels so 95 labels
    // don't clutter the whole-city view; the control checkbox still reflects
    // the user's intent to show it once zoomed in past the threshold. A
    // "programmatic" guard stops our own zoom-driven add/remove calls from
    // being misread as the user toggling the checkbox (Leaflet's layers
    // control fires the same overlayadd/overlayremove events either way).
    const LABEL_MIN_ZOOM = 13;
    let wanted = false;
    let programmatic = false;
    const applyZoomGate = () => {
      const shouldShow = wanted && map.getZoom() >= LABEL_MIN_ZOOM;
      const isShown = map.hasLayer(layer);
      if (shouldShow === isShown) return;
      programmatic = true;
      if (shouldShow) layer.addTo(map);
      else map.removeLayer(layer);
      programmatic = false;
    };
    map.on("overlayadd", (e) => {
      if (e.layer !== layer || programmatic) return;
      wanted = true;
      applyZoomGate();
    });
    map.on("overlayremove", (e) => {
      if (e.layer !== layer || programmatic) return;
      wanted = false;
    });
    map.on("zoomend", applyZoomGate);

    layersControl.addOverlay(layer, "Noms de quartiers (zoom ≥ 13)");
  }
}
