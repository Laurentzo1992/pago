import { useState } from "react";
import type { TypeNode } from "../types";
import { collectLeafTypeIds, triState } from "../utils/tree";
import { categoricalColor } from "../utils/colors";
import TriStateCheckbox from "./TriStateCheckbox";

interface Props {
  nodes: TypeNode[];
  selectedTypes: Set<number>;
  onToggle: (ids: number[], checked: boolean) => void;
  onShowLegend: (node: TypeNode) => void;
}

export default function TypeAccordion({ nodes, selectedTypes, onToggle, onShowLegend }: Props) {
  return (
    <div>
      {nodes.map((node, index) => (
        <TypeAccordionItem
          key={node.id}
          node={node}
          color={categoricalColor(index, nodes.length)}
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
  color,
  selectedTypes,
  onToggle,
  onShowLegend,
}: {
  node: TypeNode;
  color?: string;
  selectedTypes: Set<number>;
  onToggle: (ids: number[], checked: boolean) => void;
  onShowLegend: (node: TypeNode) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLeaf = node.children.length === 0;
  const leafIds = collectLeafTypeIds(node);
  const state = triState(leafIds, selectedTypes);
  const checkboxId = `checkbox-type-${node.id}`;

  return (
    <div className="pago-node">
      <div className="pago-node-row" onMouseEnter={() => node.legend && onShowLegend(node)}>
        {isLeaf ? (
          <span className="pago-node-caret-spacer" />
        ) : (
          <button
            type="button"
            className={`pago-node-caret ${expanded ? "open" : ""}`}
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Réduire" : "Développer"}
          >
            <i className="fas fa-chevron-right" />
          </button>
        )}
        <TriStateCheckbox
          id={checkboxId}
          checked={state.checked}
          indeterminate={state.indeterminate}
          onChange={() => onToggle(leafIds, !state.checked)}
          className="pago-checkbox"
        />
        {color && <span className="pago-node-swatch" style={{ backgroundColor: color }} />}
        <label
          className="pago-node-label"
          htmlFor={checkboxId}
          onClick={(e) => {
            if (isLeaf) return;
            e.preventDefault();
            setExpanded((v) => !v);
          }}
        >
          {node.name}
        </label>
      </div>

      {!isLeaf && expanded && (
        <div className="pago-node-children">
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
      )}
    </div>
  );
}
