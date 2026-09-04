import type { StatusItem } from "../types";

interface Props {
  statuses: StatusItem[];
  selectedStatuses: Set<number>;
  onToggle: (id: number, checked: boolean) => void;
}

export default function StatusFilter({ statuses, selectedStatuses, onToggle }: Props) {
  return (
    <div className="pago-status-list">
      {statuses.map((status) => (
        <div className="pago-status-row" key={status.id}>
          <input
            className="pago-checkbox checkbox-status"
            type="checkbox"
            id={`checkbox-status-${status.id}`}
            checked={selectedStatuses.has(status.id)}
            onChange={(e) => onToggle(status.id, e.target.checked)}
          />
          <label htmlFor={`checkbox-status-${status.id}`}>{status.status}</label>
        </div>
      ))}
    </div>
  );
}
