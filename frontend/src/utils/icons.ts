import type { TypeNode } from "../types";

declare const L: typeof import("leaflet");

export function buildTypeIcons(nodes: TypeNode[], defaultIcon: L.Icon): Map<number, L.Icon> {
  const icons = new Map<number, L.Icon>();

  function visit(node: TypeNode, level: number, parentId: number | null) {
    if (node.legend) {
      icons.set(
        node.id,
        L.icon({
          iconUrl: node.legend.image,
          iconSize: [10, 10],
          iconAnchor: [5, 0],
        }),
      );
    } else if (level === 0) {
      icons.set(node.id, defaultIcon);
    } else {
      icons.set(node.id, parentId !== null ? (icons.get(parentId) ?? defaultIcon) : defaultIcon);
    }

    node.children.forEach((child) => visit(child, level + 1, node.id));
  }

  nodes.forEach((node) => visit(node, 0, null));
  return icons;
}
