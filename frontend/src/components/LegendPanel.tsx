import type { LegendInfo } from "../types";

interface Props {
  legend: LegendInfo | null;
  onClose: () => void;
}

export default function LegendPanel({ legend, onClose }: Props) {
  if (!legend) return null;

  return (
    <div id="legend" onMouseOver={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <div className="pago-legend-header">
        <span className="pago-legend-title">Légende</span>
        <button className="close" onClick={onClose} aria-label="Fermer la légende">
          &times;
        </button>
      </div>
      <div id="legend_container">
        <img id="legend_image" src={legend.image} alt={legend.description} />
        <p>{legend.description}</p>
      </div>
    </div>
  );
}
