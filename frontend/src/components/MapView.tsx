import { useEffect, useRef } from "react";
import type { Infrastructure, TrackerItem, TypeNode } from "../types";
import { formatDistance, haversineDistanceMeters } from "../utils/distance";
import type { GeoPosition } from "../utils/geolocation";
import { buildTypeIcons, fallbackIcon } from "../utils/icons";
import { loadGeoOverlays } from "../utils/geoOverlays";

declare const L: typeof import("leaflet");

const OUAGADOUGOU_CENTER: [number, number] = [12.3569, -1.5352];

function formatRelativeTime(isoDate: string | null): string {
  if (!isoDate) return "Position jamais reçue";
  const seconds = Math.max(0, (Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return "À l'instant";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  return `Il y a ${Math.round(hours / 24)} j`;
}

interface MeasurePoint {
  id: number;
  latlng: L.LatLng;
  name: string;
}

interface Props {
  types: TypeNode[];
  infrastructures: Infrastructure[];
  focusInfrastructureId: number | null;
  position: GeoPosition | null;
  locationEnabled: boolean;
  onToggleLocation: () => void;
  trackers: TrackerItem[];
}

export default function MapView({
  types,
  infrastructures,
  focusInfrastructureId,
  position,
  locationEnabled,
  onToggleLocation,
  trackers,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersCanvasRef = useRef<any>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const iconsRef = useRef<Map<number, L.Icon>>(new Map());
  const positionMarkerRef = useRef<L.Marker | null>(null);
  const positionCircleRef = useRef<L.Circle | null>(null);
  const locationBtnRef = useRef<HTMLDivElement | null>(null);
  const onToggleLocationRef = useRef(onToggleLocation);
  useEffect(() => {
    onToggleLocationRef.current = onToggleLocation;
  }, [onToggleLocation]);
  const measureModeRef = useRef(false);
  const measurePointsRef = useRef<MeasurePoint[]>([]);
  const measureLineRef = useRef<L.Polyline | null>(null);
  const trackerMarkersRef = useRef<Map<number, L.Marker>>(new Map());

  function clearMeasureLine() {
    measureLineRef.current?.remove();
    measureLineRef.current = null;
  }

  function drawMeasureLine(a: MeasurePoint, b: MeasurePoint) {
    const map = mapRef.current;
    if (!map) return;
    clearMeasureLine();

    const distanceMeters = haversineDistanceMeters(a.latlng.lat, a.latlng.lng, b.latlng.lat, b.latlng.lng);
    const line = L.polyline([a.latlng, b.latlng], { color: "#b3413b", weight: 5, dashArray: "8 6" }).addTo(map);
    line.bindTooltip(`<b>${formatDistance(distanceMeters)}</b><br>${a.name} ↔ ${b.name}`, {
      permanent: true,
      direction: "center",
      className: "pago-measure-tooltip",
    });
    measureLineRef.current = line;
  }

  // Click handler shared by every infrastructure marker: only does anything
  // while measure mode is on. First click on a site starts the pair, a
  // second (different) site completes it and draws the line, and a third
  // click anywhere starts a fresh pair (clicking the already-selected first
  // site again just clears it).
  function handleMeasureClick(point: MeasurePoint) {
    if (!measureModeRef.current) return;
    const points = measurePointsRef.current;

    if (points.length === 1 && points[0].id === point.id) {
      measurePointsRef.current = [];
      clearMeasureLine();
      return;
    }

    if (points.length !== 1) {
      clearMeasureLine();
      measurePointsRef.current = [point];
      return;
    }

    const pair = [points[0], point];
    measurePointsRef.current = pair;
    drawMeasureLine(pair[0], pair[1]);
  }

  // Map setup, once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { maxZoom: 18, zoomControl: false });
    map.setView(OUAGADOUGOU_CENTER, 10);

    const streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });

    const satelliteImagery = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS community",
      },
    );
    const satelliteLabels = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 },
    );
    const hybrid = L.layerGroup([satelliteImagery, satelliteLabels]);

    streets.addTo(map);

    const layersControl = L.control
      .layers(
        { "Plan": streets, "Satellite": satelliteImagery, "Hybride": hybrid },
        {},
        { position: "topright" },
      )
      .addTo(map);

    loadGeoOverlays(map, layersControl);

    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.scale({ metric: true, imperial: false, position: "bottomright" }).addTo(map);

    const ctlZoomToFit = new (L.Control as any)();
    ctlZoomToFit.onAdd = () => {
      const div = L.DomUtil.create("div", "zoomtofit leaflet-bar");
      div.title = "Centrer la carte sur Ouagadougou";
      div.innerHTML = '<i class="fas fa-crosshairs"></i>';
      div.onclick = () => map.setView(OUAGADOUGOU_CENTER, 13);
      L.DomEvent.on(div, "click", (ev: Event) => L.DomEvent.stopPropagation(ev));
      return div;
    };
    ctlZoomToFit.addTo(map);

    const ctlLocation = new (L.Control as any)();
    ctlLocation.onAdd = () => {
      const div = L.DomUtil.create("div", "pago-location-btn leaflet-bar");
      div.title = "Afficher ma position et la distance aux sites";
      div.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
      div.onclick = () => onToggleLocationRef.current();
      L.DomEvent.on(div, "click", (ev: Event) => L.DomEvent.stopPropagation(ev));
      locationBtnRef.current = div;
      return div;
    };
    ctlLocation.addTo(map);

    const ctlMeasure = new (L.Control as any)();
    ctlMeasure.onAdd = () => {
      const div = L.DomUtil.create("div", "pago-measure-btn leaflet-bar");
      div.title = "Mesurer la distance entre deux sites";
      div.innerHTML = '<i class="fas fa-ruler"></i>';
      div.onclick = () => {
        measureModeRef.current = !measureModeRef.current;
        div.classList.toggle("active", measureModeRef.current);
        measurePointsRef.current = [];
        clearMeasureLine();
      };
      L.DomEvent.on(div, "click", (ev: Event) => L.DomEvent.stopPropagation(ev));
      return div;
    };
    ctlMeasure.addTo(map);

    if ((L.control as any).zoomBox) {
      (L.control as any)
        .zoomBox({
          modal: false,
          position: "topright",
          title: "Zoom vers une région spécifique",
        })
        .addTo(map);
    }

    const markersCanvas = new (L as any).MarkersCanvas();
    markersCanvas.addTo(map);

    mapRef.current = map;
    markersCanvasRef.current = markersCanvas;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Rebuild the icon lookup whenever the type tree changes.
  useEffect(() => {
    iconsRef.current = buildTypeIcons(types);
  }, [types]);

  // Reflect the toggle state on the location control button.
  useEffect(() => {
    locationBtnRef.current?.classList.toggle("active", locationEnabled);
  }, [locationEnabled]);

  // Rebuild markers whenever the filtered infrastructure list changes, or the
  // icon lookup is rebuilt - `types` and `infrastructures` load from two
  // independent requests, so if icons arrive after infrastructures already
  // did, markers must be redrawn once the real icons are ready instead of
  // being stuck on the fallback dot.
  useEffect(() => {
    const markersCanvas = markersCanvasRef.current;
    if (!markersCanvas) return;

    // The filtered set changed - any in-progress or completed measurement
    // referred to markers that may no longer exist, so drop it.
    measurePointsRef.current = [];
    clearMeasureLine();

    const markers = new Map<number, L.Marker>();
    infrastructures.forEach((infra) => {
      const lat = Number(infra.latitude);
      const lng = Number(infra.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const icon = (infra.type_id !== null && iconsRef.current.get(infra.type_id)) || fallbackIcon();
      const marker = L.marker([lat, lng], { icon });
      marker.bindPopup(`<b>${infra.nom ?? ""}</b><br><b>Emplacement: </b>${infra.emplacement ?? ""}<br>`);
      marker.on("click", () =>
        handleMeasureClick({ id: infra.id, latlng: L.latLng(lat, lng), name: infra.nom ?? "Infrastructure" }),
      );
      markers.set(infra.id, marker);
    });

    markersRef.current = markers;
    markersCanvas.clear();
    markersCanvas.addMarkers(Array.from(markers.values()));
  }, [infrastructures, types]);

  // Focus a marker when a result row is clicked.
  useEffect(() => {
    if (focusInfrastructureId === null) return;
    const map = mapRef.current;
    const marker = markersRef.current.get(focusInfrastructureId);
    if (!map || !marker) return;

    map.setView(marker.getLatLng(), 15);
    marker.openPopup();
  }, [focusInfrastructureId]);

  // Live position dot + accuracy circle, updated in place as the browser
  // reports new fixes instead of being torn down and recreated each time.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!position) {
      positionMarkerRef.current?.remove();
      positionCircleRef.current?.remove();
      positionMarkerRef.current = null;
      positionCircleRef.current = null;
      return;
    }

    const latlng: [number, number] = [position.lat, position.lng];

    if (!positionMarkerRef.current) {
      positionMarkerRef.current = L.marker(latlng, {
        icon: L.divIcon({
          className: "pago-live-position",
          html: '<span class="pago-live-position-dot"></span>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
        zIndexOffset: 1000,
        interactive: false,
      }).addTo(map);
    } else {
      positionMarkerRef.current.setLatLng(latlng);
    }

    if (!positionCircleRef.current) {
      positionCircleRef.current = L.circle(latlng, {
        radius: position.accuracy,
        color: "#b3413b",
        weight: 1,
        fillColor: "#b3413b",
        fillOpacity: 0.1,
        interactive: false,
      }).addTo(map);
    } else {
      positionCircleRef.current.setLatLng(latlng);
      positionCircleRef.current.setRadius(position.accuracy);
    }
  }, [position]);

  // GPS-equipped equipment markers, updated in place as fresh positions are
  // polled in rather than being torn down and recreated every time.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seenIds = new Set<number>();

    trackers.forEach((tracker) => {
      if (tracker.last_lat === null || tracker.last_lng === null) return;
      seenIds.add(tracker.id);

      const latlng: [number, number] = [tracker.last_lat, tracker.last_lng];
      const popup = `<b>${tracker.name}</b><br>${formatRelativeTime(tracker.last_seen_at)}`;

      const existing = trackerMarkersRef.current.get(tracker.id);
      if (existing) {
        existing.setLatLng(latlng);
        existing.setPopupContent(popup);
        return;
      }

      const marker = L.marker(latlng, {
        icon: L.divIcon({
          className: "pago-tracker-marker",
          html: '<span class="pago-tracker-dot"><i class="fas fa-truck"></i></span>',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
        zIndexOffset: 900,
      })
        .addTo(map)
        .bindPopup(popup);
      trackerMarkersRef.current.set(tracker.id, marker);
    });

    // Drop markers for trackers that were removed or lost their position.
    trackerMarkersRef.current.forEach((marker, id) => {
      if (seenIds.has(id)) return;
      marker.remove();
      trackerMarkersRef.current.delete(id);
    });
  }, [trackers]);

  return <div id="map" ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
