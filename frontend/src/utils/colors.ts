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
