import type { TypeNode } from "../types";
import { categoricalColor, dotIconDataUri, FALLBACK_COLOR } from "./colors";

declare const L: typeof import("leaflet");

/**
 * One icon per type id. Types with a configured Legend use that image;
 * everything else inherits a color-coded dot from its root category, so
 * markers are visually distinguishable even before any Legend is set up.
 */
export function buildTypeIcons(nodes: TypeNode[]): Map<number, L.Icon> {
  const icons = new Map<number, L.Icon>();

  function visit(node: TypeNode, level: number, parentId: number | null, rootColor: string) {
    if (node.legend) {
      icons.set(
        node.id,
        L.icon({
          iconUrl: node.legend.image,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        }),
      );
    } else if (level === 0) {
      icons.set(
        node.id,
        L.icon({
          iconUrl: dotIconDataUri(rootColor),
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
      );
    } else {
      const parentIcon = parentId !== null ? icons.get(parentId) : undefined;
      icons.set(node.id, parentIcon ?? L.icon({ iconUrl: dotIconDataUri(rootColor), iconSize: [14, 14], iconAnchor: [7, 7] }));
    }

    node.children.forEach((child) => visit(child, level + 1, node.id, rootColor));
  }

  nodes.forEach((node, index) => visit(node, 0, null, categoricalColor(index, nodes.length)));
  return icons;
}

export function fallbackIcon(): L.Icon {
  return L.icon({ iconUrl: dotIconDataUri(FALLBACK_COLOR), iconSize: [14, 14], iconAnchor: [7, 7] });
}
