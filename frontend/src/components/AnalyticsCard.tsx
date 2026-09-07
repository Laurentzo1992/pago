import type { ReactNode } from "react";
import { useDragHandle } from "../utils/drag";

export interface CardPosition {
  x: number;
  y: number;
}

interface Props {
  title: string;
  icon: string;
  children: ReactNode;
  position: CardPosition;
  zIndex?: number;
  onClose: () => void;
  onMove: (dx: number, dy: number) => void;
}

export default function AnalyticsCard({ title, icon, children, position, zIndex = 1200, onClose, onMove }: Props) {
  const drag = useDragHandle(onMove);

  return (
    <div className="pago-analytics-card" style={{ left: position.x, top: position.y, zIndex }}>
      <div
        className="pago-analytics-card-header draggable"
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
      >
        <i className={icon} />
        <span className="pago-analytics-card-title">{title}</span>
        <button
          className="pago-analytics-card-btn"
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
          title="Fermer"
        >
          <i className="fas fa-xmark" />
        </button>
      </div>
      <div className="pago-analytics-card-body">{children}</div>
    </div>
  );
}
