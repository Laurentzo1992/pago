import type { CommuneNode, GuideItem, Infrastructure, StatusItem, TypeNode } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchTypes(): Promise<TypeNode[]> {
  return getJson<TypeNode[]>("/api/types");
}

export function fetchLocations(): Promise<CommuneNode[]> {
  return getJson<CommuneNode[]>("/api/locations");
}

export function fetchStatuses(): Promise<StatusItem[]> {
  return getJson<StatusItem[]>("/api/status");
}

export function fetchGuides(): Promise<GuideItem[]> {
  return getJson<GuideItem[]>("/api/guides");
}

export interface InfrastructureFilters {
  selectedTypes: number[];
  selectedQuarters: number[];
  selectedStatuses: number[];
}

export async function fetchInfrastructures(filters: InfrastructureFilters): Promise<Infrastructure[]> {
  const res = await fetch(`${API_BASE}/api/infrastructures`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      selected_types: filters.selectedTypes,
      selected_quarters: filters.selectedQuarters,
      selected_statuses: filters.selectedStatuses,
    }),
  });
  if (!res.ok) {
    throw new Error(`POST /api/infrastructures failed: ${res.status}`);
  }
  return res.json() as Promise<Infrastructure[]>;
}
