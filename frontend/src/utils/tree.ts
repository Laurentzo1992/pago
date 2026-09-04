import type { ArrondissementNode, SecteurNode, TypeNode } from "../types";

export interface TriState {
  checked: boolean;
  indeterminate: boolean;
}

export function collectLeafTypeIds(node: TypeNode): number[] {
  if (node.children.length === 0) return [node.id];
  return node.children.flatMap(collectLeafTypeIds);
}

export function collectQuartierIdsFromArrondissement(arrondissement: ArrondissementNode): number[] {
  return arrondissement.secteurs.flatMap((secteur) => secteur.quartiers.map((q) => q.id));
}

export function collectQuartierIdsFromSecteur(secteur: SecteurNode): number[] {
  return secteur.quartiers.map((q) => q.id);
}

export function triState(ids: number[], selected: Set<number>): TriState {
  if (ids.length === 0) return { checked: false, indeterminate: false };
  const selectedCount = ids.filter((id) => selected.has(id)).length;
  if (selectedCount === 0) return { checked: false, indeterminate: false };
  if (selectedCount === ids.length) return { checked: true, indeterminate: false };
  return { checked: false, indeterminate: true };
}
