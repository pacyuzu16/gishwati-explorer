import { loadFireModel, predictFire, type FireModel } from "../lib/fireModel";
import { icon } from "../lib/icons";

interface SliderDef {
  key: string;
  label: string;
  iconName: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
}

// Ranges chosen to be realistic and to span low→high risk.
const SLIDERS: SliderDef[] = [
  { key: "Temperature", label: "Temperature", iconName: "thermometer", min: 15, max: 45, step: 1, value: 33, unit: "°C" },
  { key: "RH", label: "Humidity", iconName: "droplet", min: 20, max: 95, step: 1, value: 45, unit: "% RH" },
  { key: "Ws", label: "Wind speed", iconName: "wind", min: 5, max: 35, step: 1, value: 16, unit: "km/h" },
  { key: "Rain", label: "Rainfall", iconName: "droplet", min: 0, max: 20, step: 0.1, value: 0, unit: "mm" },
];

const BAND_COLOR: Record<string, string> = {
  Low: "text-emerald-400",
  Moderate: "text-amber-400",
  High: "text-red-400",
};
const BAR_COLOR: Record<string, string> = {
  Low: "bg-emerald-500",
  Moderate: "bg-amber-500",
  High: "bg-red-500",
};

export async function initFirePanel() {
  const inputsEl = document.getElementById("fire-inputs");
  const outEl = document.getElementById("fire-out");
  const metaEl = document.getElementById("fire-meta");
  if (!inputsEl || !outEl || !metaEl) return;

  let model: FireModel;
  try {
    model = await loadFireModel();
  } catch {
    outEl.innerHTML = `<p class="text-sm text-red-400">Could not load model.</p>`;
    return;
  }

  // Build sliders
  inputsEl.innerHTML = SLIDERS.map(
    (s) => `
    <div>
      <div class="mb-1 flex items-center justify-between text-xs">
        <span class="flex items-center gap-1.5 text-slate-300">${icon(s.iconName, "h-4 w-4 text-emerald-400")} ${s.label}</span>
        <span class="font-semibold tabular-nums text-slate-100"><span data-out="${s.key}">${s.value}</span> ${s.unit}</span>
      </div>
      <input type="range" data-fire="${s.key}" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}" class="w-full accent-emerald-500" />
    </div>`
  ).join("");

  const ranges = Array.from(inputsEl.querySelectorAll<HTMLInputElement>("input[data-fire]"));

  const update = () => {
    const inputs = SLIDERS.map((s) => {
      const el = ranges.find((r) => r.dataset.fire === s.key)!;
      const v = +el.value;
      (inputsEl.querySelector(`[data-out="${s.key}"]`) as HTMLElement).textContent = String(v);
      return v;
    });
    const { probability, band } = predictFire(model, inputs);
    const pct = Math.round(probability * 100);
    outEl.innerHTML = `
      <div class="text-xs uppercase tracking-wider text-slate-400">Predicted wildfire risk</div>
      <div class="my-1 text-3xl font-black ${BAND_COLOR[band]}">${band}</div>
      <div class="mx-auto h-2.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-700">
        <div class="h-full rounded-full ${BAR_COLOR[band]} transition-all" style="width:${pct}%"></div>
      </div>
      <div class="mt-1.5 text-xs text-slate-400">${pct}% probability of fire under these conditions</div>`;
  };

  ranges.forEach((r) => r.addEventListener("input", update));
  update();

  metaEl.innerHTML = `Model: logistic regression · ${(model.test_accuracy * 100).toFixed(0)}% test accuracy ·
    ${model.n_samples} samples<br>Source: ${model.source}`;
}
