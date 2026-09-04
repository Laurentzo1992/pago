import { useState } from "react";
import type { Stats, StatusItem, TypeNode } from "../types";
import { categoricalColor, FALLBACK_COLOR } from "../utils/colors";
import AnalyticsCard, { type CardPosition } from "./AnalyticsCard";
import BarChart from "./BarChart";
import DonutChart from "./DonutChart";

type CardId = "category" | "status" | "communes";

const CARD_DEFS: { id: CardId; title: string; icon: string }[] = [
  { id: "category", title: "Par catégorie", icon: "fas fa-chart-bar" },
  { id: "status", title: "Par statut", icon: "fas fa-chart-pie" },
  { id: "communes", title: "Top communes", icon: "fas fa-city" },
];

interface Props {
  visible: boolean;
  stats: Stats | null;
  types: TypeNode[];
  statuses: StatusItem[];
  onClose: () => void;
}

export default function Analytics({ visible, stats, types, statuses, onClose }: Props) {
  const [positions, setPositions] = useState<Record<CardId, CardPosition | null>>({
    category: null,
    status: null,
    communes: null,
  });
  const [order, setOrder] = useState<CardId[]>(["category", "status", "communes"]);

  if (!visible || !stats) return null;

  const categoryColor = (typeId: number) => {
    const idx = types.findIndex((t) => t.id === typeId);
    return idx === -1 ? FALLBACK_COLOR : categoricalColor(idx, types.length);
  };
  const statusColor = (statusId: number) => {
    const idx = statuses.findIndex((s) => s.id === statusId);
    return idx === -1 ? FALLBACK_COLOR : categoricalColor(idx, Math.max(statuses.length, 2));
  };

  const bringToFront = (id: CardId) => setOrder((prev) => [...prev.filter((x) => x !== id), id]);

  const detach = (id: CardId) => {
    const offset = order.indexOf(id) * 28;
    setPositions((prev) => ({ ...prev, [id]: { x: 100 + offset, y: 90 + offset } }));
    bringToFront(id);
  };
  const dock = (id: CardId) => setPositions((prev) => ({ ...prev, [id]: null }));
  const move = (id: CardId, dx: number, dy: number) =>
    setPositions((prev) => {
      const pos = prev[id];
      if (!pos) return prev;
      const maxX = Math.max(window.innerWidth - 60, 0);
      const maxY = Math.max(window.innerHeight - 40, 0);
      return {
        ...prev,
        [id]: {
          x: Math.min(Math.max(pos.x + dx, -240), maxX),
          y: Math.min(Math.max(pos.y + dy, 0), maxY),
        },
      };
    });

  const renderCardBody = (id: CardId) => {
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

  const docked = CARD_DEFS.filter((c) => !positions[c.id]);
  const floating = CARD_DEFS.filter((c) => positions[c.id]);

  return (
    <>
      <div id="analytics_panel">
        <div className="pago-legend-header">
          <span className="pago-legend-title">Statistiques · {stats.total.toLocaleString("fr-FR")} infrastructures</span>
          <button className="close" onClick={onClose} aria-label="Fermer les statistiques">
            &times;
          </button>
        </div>
        {docked.length === 0 && (
          <p className="pago-analytics-empty">Toutes les cartes sont détachées sur la carte.</p>
        )}
        {docked.map((c) => (
          <AnalyticsCard
            key={c.id}
            title={c.title}
            icon={c.icon}
            detached={false}
            position={null}
            zIndex={0}
            onDetach={() => detach(c.id)}
            onDock={() => dock(c.id)}
            onMove={() => {}}
            onFocus={() => {}}
          >
            {renderCardBody(c.id)}
          </AnalyticsCard>
        ))}
      </div>

      {floating.map((c) => (
        <AnalyticsCard
          key={c.id}
          title={c.title}
          icon={c.icon}
          detached
          position={positions[c.id]}
          zIndex={1200 + order.indexOf(c.id)}
          onDetach={() => detach(c.id)}
          onDock={() => dock(c.id)}
          onMove={(dx, dy) => move(c.id, dx, dy)}
          onFocus={() => bringToFront(c.id)}
        >
          {renderCardBody(c.id)}
        </AnalyticsCard>
      ))}
    </>
  );
}
