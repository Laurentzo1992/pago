import type { Infrastructure } from "../types";
import type { GeoPosition } from "./geolocation";

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two lat/lng points, in meters. */
export function haversineDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`;
}

export interface NearestResult {
  infra: Infrastructure;
  distanceMeters: number;
}

/** Closest infrastructure (with valid coordinates) to a position, or null if none qualify. */
export function findNearestInfrastructure(
  position: GeoPosition,
  infrastructures: Infrastructure[],
): NearestResult | null {
  let best: NearestResult | null = null;
  for (const infra of infrastructures) {
    const lat = Number(infra.latitude);
    const lng = Number(infra.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const distanceMeters = haversineDistanceMeters(position.lat, position.lng, lat, lng);
    if (!best || distanceMeters < best.distanceMeters) {
      best = { infra, distanceMeters };
    }
  }
  return best;
}
