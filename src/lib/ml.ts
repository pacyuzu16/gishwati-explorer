import type { MlProvider, MlResult } from "./types";

/**
 * Stub ML provider.
 *
 * `ndvi` is a placeholder that returns a plausible value — swap the body for
 * real band math once you load Sentinel-2 / Landsat red & NIR rasters
 * (NDVI = (NIR - Red) / (NIR + Red)). `deforestationRisk` is wired to accept a
 * TensorFlow.js or ONNX Runtime Web model later; the UI already calls it.
 *
 * To plug in a real model:
 *   import * as tf from "@tensorflow/tfjs";
 *   const model = await tf.loadLayersModel("/model/model.json");
 *   ...build an input tensor from tiles in `bbox`, run model.predict(...).
 */
export class StubMlProvider implements MlProvider {
  async ndvi(bbox: [number, number, number, number]): Promise<MlResult> {
    await delay(500);
    // Pseudo-deterministic value from the bbox so the demo feels responsive.
    const seed = Math.abs(bbox[0] + bbox[1] + bbox[2] + bbox[3]);
    const ndvi = 0.45 + (seed % 0.25);
    return {
      label: "Mean NDVI (vegetation health)",
      value: ndvi.toFixed(2),
      detail:
        ndvi > 0.6
          ? "Dense, healthy canopy in view."
          : "Mixed canopy — restoration ongoing. Replace with real Sentinel-2 band math.",
    };
  }

  async deforestationRisk(bbox: [number, number, number, number]): Promise<MlResult> {
    await delay(700);
    const seed = Math.abs((bbox[2] - bbox[0]) * (bbox[3] - bbox[1])) * 1000;
    const risk = Math.min(0.9, 0.2 + (seed % 0.6));
    const band = risk > 0.6 ? "High" : risk > 0.4 ? "Moderate" : "Low";
    return {
      label: "Deforestation risk (model stub)",
      value: `${band} (${(risk * 100).toFixed(0)}%)`,
      detail: "Placeholder output. Train a small classifier offline and load it with TensorFlow.js / ONNX Runtime Web — this method is the integration point.",
    };
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
