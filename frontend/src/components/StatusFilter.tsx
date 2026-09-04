import type { StatusItem } from "../types";

interface Props {
  statuses: StatusItem[];
  selectedStatuses: Set<number>;
  onToggle: (id: number, checked: boolean) => void;
}

export default function StatusFilter({ statuses, selectedStatuses, onToggle }: Props) {
  return (
    <div>
      {statuses.map((status) => (
        <div className="form-check" key={status.id}>
          <input
            className="form-check-input checkbox-status"
            type="checkbox"
            id={`checkbox-status-${status.id}`}
            checked={selectedStatuses.has(status.id)}
            onChange={(e) => onToggle(status.id, e.target.checked)}
          />
          <label className="form-check-label" htmlFor={`checkbox-status-${status.id}`}>
            {status.status}
          </label>
        </div>
      ))}
    </div>
  );
}
