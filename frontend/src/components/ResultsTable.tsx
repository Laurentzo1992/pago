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
      <div className="pago-results-list" id="infrastructures-table">
        {pageItems.length === 0 && <div className="pago-result-empty">Aucun résultat pour ces filtres</div>}
        {pageItems.map((infra) => (
          <div className="pago-result-row" key={infra.id} id={`result-${infra.id}`} onClick={() => onSelect(infra)}>
            {infra.nom}
          </div>
        ))}
      </div>
      {pages > 1 && (
        <div className="pago-pagination">
          <button disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
            <i className="fas fa-chevron-left" /> Précédent
          </button>
          <span>
            Page {currentPage} / {pages}
          </span>
          <button disabled={currentPage >= pages} onClick={() => setPage((p) => p + 1)}>
            Suivant <i className="fas fa-chevron-right" />
          </button>
        </div>
      )}
    </div>
  );
}
