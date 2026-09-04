import { useState } from "react";
import type { TypeNode } from "../types";
import { collectLeafTypeIds, triState } from "../utils/tree";
import TriStateCheckbox from "./TriStateCheckbox";

interface Props {
  nodes: TypeNode[];
  selectedTypes: Set<number>;
  onToggle: (ids: number[], checked: boolean) => void;
  onShowLegend: (node: TypeNode) => void;
}

export default function TypeAccordion({ nodes, selectedTypes, onToggle, onShowLegend }: Props) {
  return (
    <div className="accordion" id="types-accordion">
      {nodes.map((node) => (
        <TypeAccordionItem
          key={node.id}
          node={node}
          selectedTypes={selectedTypes}
          onToggle={onToggle}
          onShowLegend={onShowLegend}
        />
      ))}
    </div>
  );
}

function TypeAccordionItem({
  node,
  selectedTypes,
  onToggle,
  onShowLegend,
}: {
  node: TypeNode;
  selectedTypes: Set<number>;
  onToggle: (ids: number[], checked: boolean) => void;
  onShowLegend: (node: TypeNode) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLeaf = node.children.length === 0;
  const leafIds = collectLeafTypeIds(node);
  const state = triState(leafIds, selectedTypes);
  const checkboxId = `checkbox-type-${node.id}`;

  const handleChange = () => {
    onToggle(leafIds, !state.checked);
  };

  if (isLeaf) {
    return (
      <div className="accordion-body">
        <div className="form-check" onMouseEnter={() => node.legend && onShowLegend(node)}>
          <TriStateCheckbox
            id={checkboxId}
            checked={state.checked}
            indeterminate={state.indeterminate}
            onChange={handleChange}
            className="form-check-input last-level-type"
          />
          <label className="form-check-label" htmlFor={checkboxId}>
            {node.name}
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="accordion-item">
      <h2 className="accordion-header">
        <div className="form-check accordion-button" onMouseEnter={() => node.legend && onShowLegend(node)}>
          <TriStateCheckbox id={checkboxId} checked={state.checked} indeterminate={state.indeterminate} onChange={handleChange} />
          <label
            className="form-check-label flex-grow-1"
            htmlFor={checkboxId}
            onClick={(e) => {
              e.preventDefault();
              setExpanded((v) => !v);
            }}
          >
            {node.name}
          </label>
        </div>
      </h2>
      <div className={`accordion-collapse collapse ${expanded ? "show" : ""}`}>
        <div className="accordion-body">
          {node.children.map((child) => (
            <TypeAccordionItem
              key={child.id}
              node={child}
              selectedTypes={selectedTypes}
              onToggle={onToggle}
              onShowLegend={onShowLegend}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
