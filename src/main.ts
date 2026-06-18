import "./style.css";
import { MapManager } from "./map/MapManager";
import { initTabs, initLayerPanel, initWildlife, renderKmgbf } from "./ui/panels";
import { renderTrendChart, renderLossChart } from "./ui/charts";
import { initStory } from "./ui/story";
import { StubMlProvider } from "./lib/ml";
import type { MlResult } from "./lib/types";

const mm = new MapManager("map");

// Panels & content
initTabs();
initWildlife();
renderKmgbf();
renderTrendChart();
renderLossChart();
initStory(mm);

mm.map.on("load", () => {
  initLayerPanel(mm);
  updateYear(+yearInput.value);
});

/* ---- Time slider + play ---- */
const yearInput = document.getElementById("year") as HTMLInputElement;
const yearOut = document.getElementById("year-out")!;
const readout = document.getElementById("loss-readout")!;
const playBtn = document.getElementById("play-btn") as HTMLButtonElement;

function updateYear(year: number) {
  yearOut.textContent = String(year);
  const count = mm.filterYear(year);
  readout.textContent = `${count} loss patch${count === 1 ? "" : "es"}`;
}
yearInput.addEventListener("input", () => updateYear(+yearInput.value));

let playing = 0;
playBtn.addEventListener("click", () => {
  if (playing) {
    clearInterval(playing);
    playing = 0;
    playBtn.textContent = "▶";
    return;
  }
  playBtn.textContent = "⏸";
  let y = +yearInput.min;
  yearInput.value = String(y);
  updateYear(y);
  playing = window.setInterval(() => {
    y++;
    if (y > +yearInput.max) { clearInterval(playing); playing = 0; playBtn.textContent = "▶"; return; }
    yearInput.value = String(y);
    updateYear(y);
  }, 600);
});

/* ---- ML panel ---- */
const ml = new StubMlProvider();
const mlOut = document.getElementById("ml-out")!;
const showMl = (r: MlResult) => {
  mlOut.innerHTML = `<div class="text-xs text-slate-400">${r.label}</div>
    <div class="text-xl font-bold text-emerald-300">${r.value}</div>
    <p class="mt-1 text-xs text-slate-400">${r.detail}</p>`;
};
document.getElementById("ndvi-btn")!.addEventListener("click", async () => {
  mlOut.textContent = "Analysing current view…";
  showMl(await ml.ndvi(mm.bbox()));
});
document.getElementById("risk-btn")!.addEventListener("click", async () => {
  mlOut.textContent = "Running model…";
  showMl(await ml.deforestationRisk(mm.bbox()));
});

/* ---- Theme toggle ---- */
document.getElementById("theme-btn")!.addEventListener("click", () => {
  document.body.classList.toggle("light");
});

/* ---- Share & export ---- */
function toast(msg: string) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.className =
    "fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold shadow-lg";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

document.getElementById("export-btn")!.addEventListener("click", () => {
  mm.exportImage();
  toast("Map image downloaded 📷");
});

document.getElementById("share-btn")!.addEventListener("click", async () => {
  const url = window.location.href;
  const data = { title: "Gishwati Restoration Explorer", text: "A Rwandan forest's comeback — RCMRD Arts & Maps 2026", url };
  if (navigator.share) {
    try { await navigator.share(data); } catch { /* user cancelled */ }
  } else {
    await navigator.clipboard.writeText(url);
    toast("Link copied to clipboard 🔗");
  }
});
