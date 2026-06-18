/**
 * Fire-risk model loader + inference.
 *
 * Loads weights trained offline (ml/train_fire_model.py) on the Algerian
 * Forest Fires Dataset (Kaggle / UCI, ODC Public Domain) and runs logistic
 * regression in the browser — no ML runtime, tiny payload.
 */
export interface FireModel {
  name: string;
  source: string;
  features: string[];
  units: string[];
  mean: number[];
  std: number[];
  weights: number[];
  bias: number;
  test_accuracy: number;
  n_samples: number;
}

export interface FirePrediction {
  probability: number; // 0..1
  band: "Low" | "Moderate" | "High";
}

let cached: FireModel | null = null;

export async function loadFireModel(): Promise<FireModel> {
  if (cached) return cached;
  cached = await fetch("model/fire_model.json").then((r) => r.json());
  return cached!;
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** inputs in the same order/units as model.features (Temperature, RH, Ws, Rain). */
export function predictFire(model: FireModel, inputs: number[]): FirePrediction {
  let z = model.bias;
  for (let i = 0; i < model.weights.length; i++) {
    const x = (inputs[i] - model.mean[i]) / model.std[i];
    z += model.weights[i] * x;
  }
  const p = sigmoid(z);
  const band = p >= 0.66 ? "High" : p >= 0.4 ? "Moderate" : "Low";
  return { probability: p, band };
}
