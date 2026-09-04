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
    <div className="accordion" id="locations-accordion">
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
    <div className="accordion-item">
      <h2 className="accordion-header">
        <div className="form-check accordion-button">
          <TriStateCheckbox
            id={checkboxId}
            checked={state.checked}
            indeterminate={state.indeterminate}
            onChange={() => onToggle(allIds, !state.checked)}
          />
          <label
            className="form-check-label flex-grow-1"
            htmlFor={checkboxId}
            onClick={(e) => {
              e.preventDefault();
              setExpanded((v) => !v);
            }}
          >
            {commune.name}
          </label>
        </div>
      </h2>
      <div className={`accordion-collapse collapse ${expanded ? "show" : ""}`}>
        <div className="accordion-body">
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
      </div>
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

  if (!expandable) {
    return (
      <div className="accordion-body">
        <div className="form-check">
          <TriStateCheckbox
            id={checkboxId}
            checked={state.checked}
            indeterminate={state.indeterminate}
            onChange={() => onToggle(ids, !state.checked)}
          />
          <label className="form-check-label" htmlFor={checkboxId}>
            {arrondissement.name}
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="accordion-item">
      <h2 className="accordion-header">
        <div className="form-check accordion-button">
          <TriStateCheckbox
            id={checkboxId}
            checked={state.checked}
            indeterminate={state.indeterminate}
            onChange={() => onToggle(ids, !state.checked)}
          />
          <label
            className="form-check-label flex-grow-1"
            htmlFor={checkboxId}
            onClick={(e) => {
              e.preventDefault();
              setExpanded((v) => !v);
            }}
          >
            {arrondissement.name}
          </label>
        </div>
      </h2>
      <div className={`accordion-collapse collapse ${expanded ? "show" : ""}`}>
        <div className="accordion-body">
          {arrondissement.secteurs.map((secteur) => (
            <SecteurItem key={secteur.id} secteur={secteur} selectedQuarters={selectedQuarters} onToggle={onToggle} />
          ))}
        </div>
      </div>
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
    <div className="accordion-body">
      <div className="form-check">
        <TriStateCheckbox
          id={checkboxId}
          checked={state.checked}
          indeterminate={state.indeterminate}
          onChange={() => onToggle(ids, !state.checked)}
        />
        <label className="form-check-label" htmlFor={checkboxId}>
          {secteur.name}
        </label>
      </div>
    </div>
  );
}
