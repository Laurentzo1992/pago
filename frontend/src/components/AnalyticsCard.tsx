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
  detached: boolean;
  position: CardPosition | null;
  zIndex: number;
  onDetach: () => void;
  onDock: () => void;
  onMove: (dx: number, dy: number) => void;
  onFocus: () => void;
}

export default function AnalyticsCard({
  title,
  icon,
  children,
  detached,
  position,
  zIndex,
  onDetach,
  onDock,
  onMove,
  onFocus,
}: Props) {
  const drag = useDragHandle(onMove, onFocus);

  const style =
    detached && position
      ? { left: position.x, top: position.y, zIndex }
      : undefined;

  return (
    <div
      className={`pago-analytics-card ${detached ? "floating" : ""}`}
      style={style}
      onPointerDown={detached ? onFocus : undefined}
    >
      <div
        className={`pago-analytics-card-header ${detached ? "draggable" : ""}`}
        onPointerDown={detached ? drag.onPointerDown : undefined}
        onPointerMove={detached ? drag.onPointerMove : undefined}
        onPointerUp={detached ? drag.onPointerUp : undefined}
      >
        <i className={icon} />
        <span className="pago-analytics-card-title">{title}</span>
        {detached ? (
          <button className="pago-analytics-card-btn" onClick={onDock} title="Rattacher au panneau">
            <i className="fas fa-compress" />
          </button>
        ) : (
          <button className="pago-analytics-card-btn" onClick={onDetach} title="Détacher">
            <i className="fas fa-up-right-and-down-left-from-center" />
          </button>
        )}
      </div>
      <div className="pago-analytics-card-body">{children}</div>
    </div>
  );
}
