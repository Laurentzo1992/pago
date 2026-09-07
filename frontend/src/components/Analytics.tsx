import { useEffect, useState } from "react";
import type { Stats, StatusItem, TypeNode } from "../types";
import { categoricalColor, FALLBACK_COLOR } from "../utils/colors";
import AnalyticsCard, { type CardPosition } from "./AnalyticsCard";
import BarChart from "./BarChart";
import DonutChart from "./DonutChart";

type SectionId = "category" | "status" | "communes" | "condition";
type SectionMode = "docked" | "detached" | "closed";

const SECTION_DEFS: { id: SectionId; title: string; icon: string }[] = [
  { id: "category", title: "Par catégorie", icon: "fas fa-chart-bar" },
  { id: "status", title: "Par statut", icon: "fas fa-chart-pie" },
  { id: "communes", title: "Top communes", icon: "fas fa-city" },
  { id: "condition", title: "État du bâti", icon: "fas fa-house-chimney-crack" },
];

// Severity-ordered (worst to best) rather than by count, with a matching
// red-to-green scale - the raw strings come straight from the source data,
// double space in "Bon  état" included.
const CONDITION_ORDER = ["Très mauvais état", "Mauvais état", "Bon  état", "Très bon état"];
const CONDITION_COLORS: Record<string, string> = {
  "Très mauvais état": "#b3413b",
  "Mauvais état": "#d97706",
  "Bon  état": "#65a30d",
  "Très bon état": "#1b5e46",
};

function dockedDefaultPosition(): CardPosition {
  return { x: Math.max(window.innerWidth - 400, 20), y: 76 };
}

function initialModes(): Record<SectionId, SectionMode> {
  return { category: "docked", status: "docked", communes: "docked", condition: "docked" };
}

interface Props {
  visible: boolean;
  stats: Stats | null;
  types: TypeNode[];
  statuses: StatusItem[];
  onClose: () => void;
}

export default function Analytics({ visible, stats, types, statuses, onClose }: Props) {
  const [dockedPosition, setDockedPosition] = useState<CardPosition>(dockedDefaultPosition);
  const [mode, setMode] = useState<Record<SectionId, SectionMode>>(initialModes);
  const [positions, setPositions] = useState<Record<SectionId, CardPosition>>({
    category: { x: 0, y: 0 },
    status: { x: 0, y: 0 },
    communes: { x: 0, y: 0 },
    condition: { x: 0, y: 0 },
  });

  // Reset to the default (everything docked together) whenever the feature
  // is reopened from the header toggle.
  useEffect(() => {
    if (visible) {
      setMode(initialModes());
      setDockedPosition(dockedDefaultPosition());
    }
  }, [visible]);

  if (!visible || !stats) return null;

  const categoryColor = (typeId: number) => {
    const idx = types.findIndex((t) => t.id === typeId);
    return idx === -1 ? FALLBACK_COLOR : categoricalColor(idx, types.length);
  };
  const statusColor = (statusId: number) => {
    const idx = statuses.findIndex((s) => s.id === statusId);
    return idx === -1 ? FALLBACK_COLOR : categoricalColor(idx, Math.max(statuses.length, 2));
  };

  const detachedCount = SECTION_DEFS.filter((s) => mode[s.id] === "detached").length;

  const detach = (id: SectionId) => {
    const offset = detachedCount * 28;
    setPositions((prev) => ({ ...prev, [id]: { x: 140 + offset, y: 100 + offset } }));
    setMode((prev) => ({ ...prev, [id]: "detached" }));
  };
  const close = (id: SectionId) => setMode((prev) => ({ ...prev, [id]: "closed" }));
  const moveDocked = (dx: number, dy: number) => setDockedPosition((prev) => clampMove(prev, dx, dy));
  const moveDetached = (id: SectionId, dx: number, dy: number) =>
    setPositions((prev) => ({ ...prev, [id]: clampMove(prev[id], dx, dy) }));

  const renderChart = (id: SectionId) => {
    if (id === "category") {
      return (
        <BarChart
          data={stats.by_category.map((c) => ({ label: c.name, value: c.count, color: categoryColor(c.type_id) }))}
        />
      );
    }
    if (id === "status") {
      return (
        <DonutChart
          data={stats.by_status.map((s) => ({ label: s.name, value: s.count, color: statusColor(s.status_id) }))}
        />
      );
    }
    if (id === "condition") {
      const sorted = [...stats.by_condition].sort(
        (a, b) => CONDITION_ORDER.indexOf(a.etat) - CONDITION_ORDER.indexOf(b.etat),
      );
      return (
        <DonutChart
          data={sorted.map((c) => ({ label: c.etat.trim(), value: c.count, color: CONDITION_COLORS[c.etat] ?? FALLBACK_COLOR }))}
        />
      );
    }
    return (
      <BarChart
        data={stats.top_communes.map((c, i) => ({
          label: c.name,
          value: c.count,
          color: categoricalColor(i, stats.top_communes.length),
        }))}
      />
    );
  };

  const dockedSections = SECTION_DEFS.filter((s) => mode[s.id] === "docked");
  const detachedSections = SECTION_DEFS.filter((s) => mode[s.id] === "detached");

  return (
    <>
      {dockedSections.length > 0 && (
        <AnalyticsCard
          title={`Statistiques · ${stats.total.toLocaleString("fr-FR")} infrastructures`}
          icon="fas fa-chart-simple"
          position={dockedPosition}
          onClose={onClose}
          onMove={moveDocked}
        >
          {dockedSections.map((s) => (
            <section className="pago-analytics-section" key={s.id}>
              <h4 className="pago-analytics-section-title">
                <i className={s.icon} />
                <span className="pago-analytics-section-title-text">{s.title}</span>
                <button
                  className="pago-analytics-card-btn"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => detach(s.id)}
                  title="Détacher"
                >
                  <i className="fas fa-up-right-and-down-left-from-center" />
                </button>
              </h4>
              {renderChart(s.id)}
            </section>
          ))}
        </AnalyticsCard>
      )}

      {detachedSections.map((s, i) => (
        <AnalyticsCard
          key={s.id}
          title={s.title}
          icon={s.icon}
          position={positions[s.id]}
          zIndex={1300 + i}
          onClose={() => close(s.id)}
          onMove={(dx, dy) => moveDetached(s.id, dx, dy)}
        >
          {renderChart(s.id)}
        </AnalyticsCard>
      ))}
    </>
  );
}

function clampMove(pos: CardPosition, dx: number, dy: number): CardPosition {
  const maxX = Math.max(window.innerWidth - 60, 0);
  const maxY = Math.max(window.innerHeight - 40, 0);
  return {
    x: Math.min(Math.max(pos.x + dx, -240), maxX),
    y: Math.min(Math.max(pos.y + dy, 0), maxY),
  };
}
