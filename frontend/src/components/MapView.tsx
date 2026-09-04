import { useEffect, useRef } from "react";
import type { Infrastructure, TypeNode } from "../types";
import { buildTypeIcons } from "../utils/icons";
import defaultIconUrl from "../assets/img/rectangle-red.png";

declare const L: typeof import("leaflet");

const OUAGADOUGOU_CENTER: [number, number] = [12.3569, -1.5352];

interface Props {
  types: TypeNode[];
  infrastructures: Infrastructure[];
  focusInfrastructureId: number | null;
}

export default function MapView({ types, infrastructures, focusInfrastructureId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersCanvasRef = useRef<any>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const iconsRef = useRef<Map<number, L.Icon>>(new Map());

  // Map setup, once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { maxZoom: 18, zoomControl: false });
    map.setView(OUAGADOUGOU_CENTER, 10);

    const osm = L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    osm.addTo(map);

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
    const defaultIcon = L.icon({
      iconUrl: defaultIconUrl,
      iconSize: [4, 4],
      iconAnchor: [2, 0],
    });
    iconsRef.current = buildTypeIcons(types, defaultIcon);
  }, [types]);

  // Rebuild markers whenever the filtered infrastructure list changes.
  useEffect(() => {
    const markersCanvas = markersCanvasRef.current;
    if (!markersCanvas) return;

    const markers = new Map<number, L.Marker>();
    infrastructures.forEach((infra) => {
      const lat = Number(infra.latitude);
      const lng = Number(infra.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const icon = (infra.type_id !== null && iconsRef.current.get(infra.type_id)) || undefined;
      const marker = L.marker([lat, lng], icon ? { icon } : undefined);
      marker.bindPopup(`<b>${infra.nom ?? ""}</b><br><b>Emplacement: </b>${infra.emplacement ?? ""}<br>`);
      markers.set(infra.id, marker);
    });

    markersRef.current = markers;
    markersCanvas.clear();
    markersCanvas.addMarkers(Array.from(markers.values()));
  }, [infrastructures]);

  // Focus a marker when a result row is clicked.
  useEffect(() => {
    if (focusInfrastructureId === null) return;
    const map = mapRef.current;
    const marker = markersRef.current.get(focusInfrastructureId);
    if (!map || !marker) return;

    map.setView(marker.getLatLng(), 15);
    marker.openPopup();
  }, [focusInfrastructureId]);

  return <div id="map" ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
