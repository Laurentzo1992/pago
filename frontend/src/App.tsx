import { useEffect, useState } from "react";
import { fetchGuides, fetchInfrastructures, fetchLocations, fetchStatuses, fetchTypes } from "./api/client";
import type { CommuneNode, GuideItem, Infrastructure, LegendInfo, StatusItem, TypeNode } from "./types";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import LegendPanel from "./components/LegendPanel";

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

  return (
    <>
      <Navbar guides={guides} onToggleSidebar={() => setSidebarVisible((v) => !v)} />
      <div id="map-wrapper" style={{ position: "relative", height: "calc(100vh - 56px)" }}>
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
          className={`btn btn-dark d-flex align-items-center ${sidebarVisible ? "slide_button_visible" : ""}`}
          type="button"
          onClick={() => setSidebarVisible((v) => !v)}
        >
          <i className={`fas fa-angle-double-right ${sidebarVisible ? "fa-rotate-180" : ""}`} />
        </button>
        <LegendPanel legend={legend} onClose={() => setLegend(null)} />
        <MapView types={types} infrastructures={infrastructures} focusInfrastructureId={focusInfrastructureId} />
      </div>
    </>
  );
}
