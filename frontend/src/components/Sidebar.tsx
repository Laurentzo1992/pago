import { useState } from "react";
import type { CommuneNode, Infrastructure, StatusItem, TypeNode } from "../types";
import TypeAccordion from "./TypeAccordion";
import LocationAccordion from "./LocationAccordion";
import StatusFilter from "./StatusFilter";
import ResultsTable from "./ResultsTable";

type Tab = "types" | "emplacement" | "status" | "result";

interface Props {
  visible: boolean;
  types: TypeNode[];
  communes: CommuneNode[];
  statuses: StatusItem[];
  selectedTypes: Set<number>;
  selectedQuarters: Set<number>;
  selectedStatuses: Set<number>;
  infrastructures: Infrastructure[];
  onToggleTypes: (ids: number[], checked: boolean) => void;
  onToggleQuarters: (ids: number[], checked: boolean) => void;
  onToggleStatus: (id: number, checked: boolean) => void;
  onSelectInfrastructure: (infra: Infrastructure) => void;
  onShowLegend: (node: TypeNode) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "types", label: "Infrastructure" },
  { id: "emplacement", label: "Emplacement" },
  { id: "status", label: "Statut" },
  { id: "result", label: "Résultats" },
];

export default function Sidebar(props: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("types");

  return (
    <div id="slide_menu" className={props.visible ? "slide_menu_visible" : ""}>
      <div className="pago-sidebar-header">
        <p className="pago-sidebar-title">Filtrer par</p>
        <div className="pago-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`pago-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pago-sidebar-body">
        {activeTab === "types" && (
          <TypeAccordion
            nodes={props.types}
            selectedTypes={props.selectedTypes}
            onToggle={props.onToggleTypes}
            onShowLegend={props.onShowLegend}
          />
        )}
        {activeTab === "emplacement" && (
          <LocationAccordion
            communes={props.communes}
            selectedQuarters={props.selectedQuarters}
            onToggle={props.onToggleQuarters}
          />
        )}
        {activeTab === "status" && (
          <StatusFilter
            statuses={props.statuses}
            selectedStatuses={props.selectedStatuses}
            onToggle={props.onToggleStatus}
          />
        )}
        {activeTab === "result" && (
          <ResultsTable infrastructures={props.infrastructures} onSelect={props.onSelectInfrastructure} />
        )}
      </div>
    </div>
  );
}
