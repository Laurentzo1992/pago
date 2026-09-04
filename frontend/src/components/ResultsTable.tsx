import { useMemo, useState } from "react";
import type { Infrastructure } from "../types";

interface Props {
  infrastructures: Infrastructure[];
  onSelect: (infra: Infrastructure) => void;
}

const PAGE_SIZE = 10;

export default function ResultsTable({ infrastructures, onSelect }: Props) {
  const [page, setPage] = useState(1);

  const pages = Math.max(Math.ceil(infrastructures.length / PAGE_SIZE), 1);
  const currentPage = Math.min(page, pages);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return infrastructures.slice(start, start + PAGE_SIZE);
  }, [infrastructures, currentPage]);

  return (
    <div>
      <table id="infrastructures-table" className="table table-sm">
        <tbody>
          {pageItems.map((infra) => (
            <tr key={infra.id} id={`result-${infra.id}`} onClick={() => onSelect(infra)} role="button">
              <td>{infra.nom}</td>
            </tr>
          ))}
          {pageItems.length === 0 && (
            <tr>
              <td className="text-muted">Aucun résultat</td>
            </tr>
          )}
        </tbody>
      </table>
      {pages > 1 && (
        <div className="d-flex justify-content-between align-items-center">
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Précédent
          </button>
          <span>
            Page {currentPage} / {pages}
          </span>
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={currentPage >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
