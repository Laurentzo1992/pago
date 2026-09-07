import { useEffect, useMemo, useState } from "react";
import {
  fetchGuides,
  fetchInfrastructures,
  fetchLocations,
  fetchStats,
  fetchStatuses,
  fetchTrackers,
  fetchTypes,
} from "./api/client";
import type { CommuneNode, GuideItem, Infrastructure, LegendInfo, Stats, StatusItem, TrackerItem, TypeNode } from "./types";
import { findNearestInfrastructure, haversineDistanceMeters } from "./utils/distance";
import { useLiveGeolocation } from "./utils/geolocation";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import LegendPanel from "./components/LegendPanel";
import Analytics from "./components/Analytics";
import LivePositionBadge from "./components/LivePositionBadge";

function toggleIds(set: Set<number>, ids: number[], checked: boolean): Set<number> {
  const next = new Set(set);
  ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
  return next;
}

export default function App() {
  const [types, setTypes] = useState<TypeNode[]>([]);
  const [communes, setCommunes] = useState<CommuneNode[]>([]);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [guides, setGuides] = useState<GuideItem[]>([]);

  const [selectedTypes, setSelectedTypes] = useState<Set<number>>(new Set());
  const [selectedQuarters, setSelectedQuarters] = useState<Set<number>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<number>>(new Set());

  const [infrastructures, setInfrastructures] = useState<Infrastructure[]>([]);
  const [focusInfrastructureId, setFocusInfrastructureId] = useState<number | null>(null);
  const [legend, setLegend] = useState<LegendInfo | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const [analyticsVisible, setAnalyticsVisible] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  const [locationEnabled, setLocationEnabled] = useState(false);
  const { position, error: geoError } = useLiveGeolocation(locationEnabled);

  const [trackers, setTrackers] = useState<TrackerItem[]>([]);

  // The infrastructure to measure the live distance against: whichever one
  // was last selected from the results list (if it's still in the current
  // filtered set), otherwise the closest one currently on the map.
  const distanceTarget = useMemo(() => {
    if (!position) return null;

    const selected =
      focusInfrastructureId !== null
        ? infrastructures.find((infra) => infra.id === focusInfrastructureId)
        : undefined;

    if (selected) {
      const lat = Number(selected.latitude);
      const lng = Number(selected.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { infra: selected, distanceMeters: haversineDistanceMeters(position.lat, position.lng, lat, lng) };
      }
    }

    return findNearestInfrastructure(position, infrastructures);
  }, [position, infrastructures, focusInfrastructureId]);

  useEffect(() => {
    fetchTypes().then(setTypes).catch(() => alert("Impossible de joindre le serveur"));
    fetchLocations().then(setCommunes).catch(() => alert("Impossible de joindre le serveur"));
    fetchStatuses().then(setStatuses).catch(() => alert("Impossible de joindre le serveur"));
    fetchGuides().then(setGuides).catch(() => {
      /* guides are optional UI content */
    });
  }, []);

  useEffect(() => {
    if (selectedTypes.size === 0) {
      setInfrastructures([]);
      return;
    }
    fetchInfrastructures({
      selectedTypes: Array.from(selectedTypes),
      selectedQuarters: Array.from(selectedQuarters),
      selectedStatuses: Array.from(selectedStatuses),
    })
      .then(setInfrastructures)
      .catch((err) => console.error("Error fetching data:", err));
  }, [selectedTypes, selectedQuarters, selectedStatuses]);

  // Poll GPS-equipped equipment positions so their markers stay live on the
  // map without the user needing to refresh the page.
  useEffect(() => {
    const poll = () => fetchTrackers().then(setTrackers).catch((err) => console.error("Error fetching trackers:", err));
    poll();
    const intervalId = setInterval(poll, 10_000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!analyticsVisible) return;
    fetchStats({
      selectedTypes: Array.from(selectedTypes),
      selectedQuarters: Array.from(selectedQuarters),
      selectedStatuses: Array.from(selectedStatuses),
    })
      .then(setStats)
      .catch((err) => console.error("Error fetching stats:", err));
  }, [analyticsVisible, selectedTypes, selectedQuarters, selectedStatuses]);

  return (
    <>
      <Navbar
        guides={guides}
        onToggleSidebar={() => setSidebarVisible((v) => !v)}
        onToggleAnalytics={() => setAnalyticsVisible((v) => !v)}
        analyticsActive={analyticsVisible}
      />
      <div id="map-wrapper">
        <Sidebar
          visible={sidebarVisible}
          types={types}
          communes={communes}
          statuses={statuses}
          selectedTypes={selectedTypes}
          selectedQuarters={selectedQuarters}
          selectedStatuses={selectedStatuses}
          infrastructures={infrastructures}
          onToggleTypes={(ids, checked) => setSelectedTypes((prev) => toggleIds(prev, ids, checked))}
          onToggleQuarters={(ids, checked) => setSelectedQuarters((prev) => toggleIds(prev, ids, checked))}
          onToggleStatus={(id, checked) => setSelectedStatuses((prev) => toggleIds(prev, [id], checked))}
          onSelectInfrastructure={(infra) => setFocusInfrastructureId(infra.id)}
          onShowLegend={(node) => node.legend && setLegend(node.legend)}
        />
        <button
          id="slide_button"
          className={sidebarVisible ? "slide_button_visible" : ""}
          type="button"
          onClick={() => setSidebarVisible((v) => !v)}
          aria-label="Basculer le panneau de filtres"
        >
          <i className="fas fa-angle-double-right" />
        </button>
        <LegendPanel legend={legend} onClose={() => setLegend(null)} />
        <Analytics
          visible={analyticsVisible}
          stats={stats}
          types={types}
          statuses={statuses}
          onClose={() => setAnalyticsVisible(false)}
        />
        <LivePositionBadge
          error={geoError}
          target={
            distanceTarget
              ? {
                  id: distanceTarget.infra.id,
                  name: distanceTarget.infra.nom ?? "Infrastructure",
                  distanceMeters: distanceTarget.distanceMeters,
                }
              : null
          }
          onFocus={setFocusInfrastructureId}
        />
        <MapView
          types={types}
          infrastructures={infrastructures}
          focusInfrastructureId={focusInfrastructureId}
          position={position}
          locationEnabled={locationEnabled}
          onToggleLocation={() => setLocationEnabled((v) => !v)}
          trackers={trackers}
        />
      </div>
    </>
  );
}
