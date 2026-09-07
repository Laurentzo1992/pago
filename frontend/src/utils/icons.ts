import type { TypeNode } from "../types";
import { glyphForCategory } from "./categoryIcons";
import { categoricalColor, categoryMarkerDataUri, FALLBACK_COLOR } from "./colors";

declare const L: typeof import("leaflet");

const MARKER_SIZE = 26;

/**
 * One icon per type id. Types with a configured Legend use that image;
 * everything else inherits a color-coded, category-glyph marker from its
 * root category (e.g. a cart for markets, a cross for health), so markers
 * are recognizable at a glance even before any Legend is set up.
 */
export function buildTypeIcons(nodes: TypeNode[]): Map<number, L.Icon> {
  const icons = new Map<number, L.Icon>();

  function visit(node: TypeNode, level: number, parentId: number | null, rootColor: string, rootName: string | null) {
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
          iconUrl: categoryMarkerDataUri(rootColor, glyphForCategory(rootName), MARKER_SIZE),
          iconSize: [MARKER_SIZE, MARKER_SIZE],
          iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
        }),
      );
    } else {
      const parentIcon = parentId !== null ? icons.get(parentId) : undefined;
      icons.set(
        node.id,
        parentIcon ??
          L.icon({
            iconUrl: categoryMarkerDataUri(rootColor, glyphForCategory(rootName), MARKER_SIZE),
            iconSize: [MARKER_SIZE, MARKER_SIZE],
            iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
          }),
      );
    }

    node.children.forEach((child) => visit(child, level + 1, node.id, rootColor, rootName));
  }

  nodes.forEach((node, index) => visit(node, 0, null, categoricalColor(index, nodes.length), node.name));
  return icons;
}

export function fallbackIcon(): L.Icon {
  return L.icon({
    iconUrl: categoryMarkerDataUri(FALLBACK_COLOR, glyphForCategory(null), MARKER_SIZE),
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
  });
}
