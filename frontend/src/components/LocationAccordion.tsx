import { useState } from "react";
import type { ArrondissementNode, CommuneNode, SecteurNode } from "../types";
import { collectQuartierIdsFromArrondissement, collectQuartierIdsFromSecteur, triState } from "../utils/tree";
import TriStateCheckbox from "./TriStateCheckbox";

interface Props {
  communes: CommuneNode[];
  selectedQuarters: Set<number>;
  onToggle: (ids: number[], checked: boolean) => void;
}

export default function LocationAccordion({ communes, selectedQuarters, onToggle }: Props) {
  return (
    <div>
      {communes.map((commune) => (
        <CommuneItem key={commune.id} commune={commune} selectedQuarters={selectedQuarters} onToggle={onToggle} />
      ))}
    </div>
  );
}

function CommuneItem({
  commune,
  selectedQuarters,
  onToggle,
}: {
  commune: CommuneNode;
  selectedQuarters: Set<number>;
  onToggle: (ids: number[], checked: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isOuagadougou = (commune.name ?? "").trim().toLowerCase() === "ouagadougou";
  const allIds = commune.arrondissements.flatMap(collectQuartierIdsFromArrondissement);
  const state = triState(allIds, selectedQuarters);
  const checkboxId = `checkbox-commune-${commune.id}`;

  return (
    <div className="pago-node">
      <div className="pago-node-row">
        <button
          type="button"
          className={`pago-node-caret ${expanded ? "open" : ""}`}
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Réduire" : "Développer"}
        >
          <i className="fas fa-chevron-right" />
        </button>
        <TriStateCheckbox
          id={checkboxId}
          checked={state.checked}
          indeterminate={state.indeterminate}
          onChange={() => onToggle(allIds, !state.checked)}
          className="pago-checkbox"
        />
        <label
          className="pago-node-label"
          htmlFor={checkboxId}
          onClick={(e) => {
            e.preventDefault();
            setExpanded((v) => !v);
          }}
        >
          {commune.name}
        </label>
      </div>

      {expanded && (
        <div className="pago-node-children">
          {commune.arrondissements.map((arrondissement) => (
            <ArrondissementItem
              key={arrondissement.id}
              arrondissement={arrondissement}
              expandable={isOuagadougou}
              selectedQuarters={selectedQuarters}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ArrondissementItem({
  arrondissement,
  expandable,
  selectedQuarters,
  onToggle,
}: {
  arrondissement: ArrondissementNode;
  expandable: boolean;
  selectedQuarters: Set<number>;
  onToggle: (ids: number[], checked: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const ids = collectQuartierIdsFromArrondissement(arrondissement);
  const state = triState(ids, selectedQuarters);
  const checkboxId = `checkbox-arrondissement-${arrondissement.id}`;

  return (
    <div className="pago-node">
      <div className="pago-node-row">
        {expandable ? (
          <button
            type="button"
            className={`pago-node-caret ${expanded ? "open" : ""}`}
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Réduire" : "Développer"}
          >
            <i className="fas fa-chevron-right" />
          </button>
        ) : (
          <span className="pago-node-caret-spacer" />
        )}
        <TriStateCheckbox
          id={checkboxId}
          checked={state.checked}
          indeterminate={state.indeterminate}
          onChange={() => onToggle(ids, !state.checked)}
          className="pago-checkbox"
        />
        <label
          className="pago-node-label"
          htmlFor={checkboxId}
          onClick={(e) => {
            if (!expandable) return;
            e.preventDefault();
            setExpanded((v) => !v);
          }}
        >
          {arrondissement.name}
        </label>
      </div>

      {expandable && expanded && (
        <div className="pago-node-children">
          {arrondissement.secteurs.map((secteur) => (
            <SecteurItem key={secteur.id} secteur={secteur} selectedQuarters={selectedQuarters} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

function SecteurItem({
  secteur,
  selectedQuarters,
  onToggle,
}: {
  secteur: SecteurNode;
  selectedQuarters: Set<number>;
  onToggle: (ids: number[], checked: boolean) => void;
}) {
  const ids = collectQuartierIdsFromSecteur(secteur);
  const state = triState(ids, selectedQuarters);
  const checkboxId = `checkbox-secteur-${secteur.id}`;

  return (
    <div className="pago-node-row">
      <span className="pago-node-caret-spacer" />
      <TriStateCheckbox
        id={checkboxId}
        checked={state.checked}
        indeterminate={state.indeterminate}
        onChange={() => onToggle(ids, !state.checked)}
        className="pago-checkbox"
      />
      <label className="pago-node-label" htmlFor={checkboxId}>
        {secteur.name}
      </label>
    </div>
  );
}
