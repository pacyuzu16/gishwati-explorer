import { Chart, registerables } from "chart.js";
import { TREND } from "../lib/data";

Chart.register(...registerables);

const tick = { color: "#94a3b8", font: { size: 9 } };
const grid = { color: "rgba(148,163,184,0.12)" };

export function renderTrendChart() {
  const el = document.getElementById("trend-chart") as HTMLCanvasElement | null;
  if (!el) return;
  new Chart(el, {
    type: "line",
    data: {
      labels: TREND.labels,
      datasets: [{
        label: "Forest cover (ha)",
        data: TREND.values,
        borderColor: "#2a9d8f",
        backgroundColor: "rgba(42,157,143,0.18)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: tick, grid }, x: { ticks: tick, grid } },
    },
  });
}

/** Bar chart of loss features per year, built from the loss GeoJSON. */
export async function renderLossChart() {
  const el = document.getElementById("loss-chart") as HTMLCanvasElement | null;
  if (!el) return;
  const gj = await fetch("data/forest_loss_sample.geojson").then((r) => r.json());
  const byYear = new Map<number, number>();
  for (const f of gj.features) {
    const y = f.properties.loss_year as number;
    byYear.set(y, (byYear.get(y) ?? 0) + 1);
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);
  new Chart(el, {
    type: "bar",
    data: {
      labels: years.map(String),
      datasets: [{ label: "Loss patches", data: years.map((y) => byYear.get(y)!), backgroundColor: "#e63946" }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: tick, grid }, x: { ticks: tick, grid } },
    },
  });
}
