import { formatDistance } from "../utils/distance";

interface Target {
  id: number;
  name: string;
  distanceMeters: number;
}

interface Props {
  error: string | null;
  target: Target | null;
  onFocus: (id: number) => void;
}

export default function LivePositionBadge({ error, target, onFocus }: Props) {
  if (error) {
    return (
      <div className="pago-position-badge pago-position-badge-error">
        <i className="fas fa-location-crosshairs" />
        <span>{error}</span>
      </div>
    );
  }

  if (!target) return null;

  return (
    <button className="pago-position-badge" onClick={() => onFocus(target.id)} type="button">
      <i className="fas fa-location-crosshairs" />
      <span className="pago-position-badge-distance">{formatDistance(target.distanceMeters)}</span>
      <span className="pago-position-badge-name">{target.name}</span>
    </button>
  );
}
