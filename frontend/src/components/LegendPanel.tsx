import type { LegendInfo } from "../types";

interface Props {
  legend: LegendInfo | null;
  onClose: () => void;
}

export default function LegendPanel({ legend, onClose }: Props) {
  if (!legend) return null;

  return (
    <div
      id="legend"
      className="legend_visible"
      onMouseOver={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <label className="close" onClick={onClose} role="button">
        &times;
      </label>
      <label>Légende</label>
      <br />
      <div id="legend_container">
        <img id="legend_image" src={legend.image} alt={legend.description} />
        <p>{legend.description}</p>
      </div>
    </div>
  );
}
