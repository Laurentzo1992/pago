export interface LegendInfo {
  description: string;
  image: string;
}

export interface TypeNode {
  id: number;
  level: number;
  name: string | null;
  legend: LegendInfo | null;
  children: TypeNode[];
}

export interface QuartierNode {
  id: number;
  name: string | null;
}

export interface SecteurNode {
  id: number;
  name: string | null;
  quartiers: QuartierNode[];
}

export interface ArrondissementNode {
  id: number;
  name: string | null;
  secteurs: SecteurNode[];
}

export interface CommuneNode {
  id: number;
  name: string | null;
  arrondissements: ArrondissementNode[];
}

export interface StatusItem {
  id: number;
  status: string | null;
}

export interface GuideItem {
  id: number;
  file: string | null;
  url: string | null;
}

export interface Infrastructure {
  id: number;
  nom: string | null;
  type_id: number | null;
  quartier_id: number | null;
  status_id: number | null;
  repondant_id: number | null;
  etat_voie: string | null;
  emplacement: string | null;
  cloture: string | null;
  accessibilite: string | null;
  etat: string | null;
  latitude: string | null;
  longitude: string | null;
  altitude: string | null;
  precision: string | null;
}
