import type { IconGlyph } from "./categoryIcons";

/**
 * Deterministic categorical palette: evenly spaced hues around the color
 * wheel so any number of top-level infrastructure categories gets visually
 * distinct marker colors without needing a Legend configured per type.
 */
export function categoricalColor(index: number, total: number): string {
  const hue = (index * (360 / Math.max(total, 1)) + 6) % 360;
  return `hsl(${hue.toFixed(1)}, 68%, 42%)`;
}

export const FALLBACK_COLOR = "hsl(220, 10%, 45%)";

/** A small filled circle with a white ring, encoded as an SVG data URI. */
export function dotIconDataUri(color: string, size = 14): string {
  const r = size / 2 - 1.5;
  const c = size / 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<circle cx="${c}" cy="${c}" r="${r}" fill="${color}" stroke="#ffffff" stroke-width="2"/>` +
    `</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * A filled, color-coded circle with a white category glyph centered inside,
 * encoded as an SVG data URI. Used for infrastructure markers so each
 * category is recognizable at a glance instead of a plain dot.
 *
 * Markers are drawn onto an HTML canvas by leaflet-markers-canvas (for
 * performance with thousands of points), which only supports image-based
 * L.icon (it rasterizes iconUrl via `new Image()` + `drawImage`) - not
 * L.divIcon, which has no image to draw. So the glyph must be baked into the
 * icon image itself rather than rendered as a separate DOM/webfont layer.
 */
export function categoryMarkerDataUri(color: string, glyph: IconGlyph, size = 26): string {
  const r = size / 2 - 1.5;
  const c = size / 2;

  const [, , vbWidth, vbHeight] = glyph.viewBox.split(" ").map(Number);
  const iconBox = size * 0.52;
  const scale = iconBox / Math.max(vbWidth, vbHeight);
  const iconX = c - (vbWidth * scale) / 2;
  const iconY = c - (vbHeight * scale) / 2;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<circle cx="${c}" cy="${c}" r="${r}" fill="${color}" stroke="#ffffff" stroke-width="2"/>` +
    `<g transform="translate(${iconX},${iconY}) scale(${scale})" fill="#ffffff">` +
    `<path d="${glyph.path}"/>` +
    `</g>` +
    `</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
