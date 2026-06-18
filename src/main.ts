import "./style.css";
import { MapManager } from "./map/MapManager";
import { initTabs, initLayerPanel, initWildlife, renderKmgbf, renderAbout } from "./ui/panels";
import { renderTrendChart, renderLossChart, renderNdviChart } from "./ui/charts";
import { renderInsights } from "./ui/insights";
import { initStory } from "./ui/story";
import { initFirePanel } from "./ui/firePanel";
import { icon } from "./lib/icons";

/* ---- Hydrate inline icons (replaces all emoji) ---- */
document.querySelectorAll<HTMLElement>("[data-icon]").forEach((el) => {
  el.innerHTML = icon(el.dataset.icon!, el.dataset.iconCls || "h-5 w-5");
});

const mm = new MapManager("map");

// Panels & content
initTabs();
initWildlife();
renderKmgbf();
renderAbout();
renderInsights();
renderNdviChart();
renderTrendChart();
renderLossChart();
initStory(mm);
initFirePanel();

mm.map.on("load", () => {
  initLayerPanel(mm);
  updateYear(+yearInput.value);
});

/* ---- Landing / home navigation ---- */
const landing = document.getElementById("landing")!;
const showApp = () => {
  landing.classList.add("opacity-0", "pointer-events-none");
  setTimeout(() => {
    landing.classList.add("hidden");
    mm.map.resize(); // ensure correct sizing after the overlay is gone
  }, 350);
};
const showHome = () => {
  landing.classList.remove("hidden");
  requestAnimationFrame(() => landing.classList.remove("opacity-0", "pointer-events-none"));
};
document.getElementById("enter-btn")!.addEventListener("click", showApp);
document.getElementById("home-btn")!.addEventListener("click", showHome);

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
    playBtn.innerHTML = icon("play", "h-4 w-4");
    return;
  }
  playBtn.innerHTML = icon("pause", "h-4 w-4");
  let y = +yearInput.min;
  yearInput.value = String(y);
  updateYear(y);
  playing = window.setInterval(() => {
    y++;
    if (y > +yearInput.max) {
      clearInterval(playing);
      playing = 0;
      playBtn.innerHTML = icon("play", "h-4 w-4");
      return;
    }
    yearInput.value = String(y);
    updateYear(y);
  }, 600);
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
    "fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold shadow-lg";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

document.getElementById("export-btn")!.addEventListener("click", () => {
  mm.exportImage();
  toast("Map image downloaded");
});

document.getElementById("share-btn")!.addEventListener("click", async () => {
  const url = window.location.href;
  const data = { title: "Gishwati Restoration Explorer", text: "A Rwandan forest's comeback — RCMRD Arts & Maps 2026", url };
  if (navigator.share) {
    try {
      await navigator.share(data);
    } catch {
      /* user cancelled */
    }
  } else {
    await navigator.clipboard.writeText(url);
    toast("Link copied to clipboard");
  }
});
