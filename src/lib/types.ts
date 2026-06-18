export interface BasemapDef {
  id: string;
  label: string;
  tiles: string[];
  attribution: string;
}

export interface LayerDef {
  id: string;          // maplibre layer id
  label: string;
  visible: boolean;
  swatch: string;      // legend color
}

export interface Species {
  name: string;
  scientific: string;
  emoji: string;
  status: string;      // IUCN-style status
  note: string;
}

export interface StoryStep {
  title: string;
  text: string;
  center: [number, number];
  zoom: number;
}

export interface MlResult {
  label: string;
  value: string;
  detail: string;
}

/** Pluggable ML interface — drop a real TF.js / ONNX model behind this later. */
export interface MlProvider {
  ndvi(bbox: [number, number, number, number]): Promise<MlResult>;
  deforestationRisk(bbox: [number, number, number, number]): Promise<MlResult>;
}
