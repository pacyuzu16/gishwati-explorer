import { BASEMAPS, SPECIES, KMGBF } from "../lib/data";
import type { MapManager } from "../map/MapManager";

/** Wire tab switching (works for both desktop sidebar and mobile bottom sheet). */
export function initTabs() {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".tab"));
  const show = (name: string) => {
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    document.querySelectorAll<HTMLElement>("[data-panel]").forEach((p) => {
      p.classList.toggle("hidden", p.dataset.panel !== name);
    });
  };
  tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.tab!)));
  show("layers");
}

export function initLayerPanel(mm: MapManager) {
  const list = document.getElementById("layer-list")!;
  list.innerHTML = "";
  for (const l of mm.layers) {
    const row = document.createElement("div");
    row.className = "rounded-lg bg-slate-800/60 p-2";
    row.innerHTML = `
      <label class="flex items-center gap-2">
        <input type="checkbox" ${l.visible ? "checked" : ""} class="accent-emerald-500" />
        <span class="inline-block h-3 w-3 rounded" style="background:${l.swatch}"></span>
        <span class="flex-1">${l.label}</span>
      </label>
      <input type="range" min="0" max="1" step="0.05" value="${l.id === "boundary-line" ? 1 : 0.85}" class="mt-2 w-full accent-emerald-500" />`;
    const [chk, range] = row.querySelectorAll("input");
    chk.addEventListener("change", () => mm.setVisible(l.id, (chk as HTMLInputElement).checked));
    range.addEventListener("input", () => mm.setOpacity(l.id, +(range as HTMLInputElement).value));
    list.appendChild(row);
  }

  const sel = document.getElementById("basemap") as HTMLSelectElement;
  sel.innerHTML = BASEMAPS.map((b) => `<option value="${b.id}">${b.label}</option>`).join("");
  sel.addEventListener("change", () => mm.setBasemap(sel.value));

  const cmp = document.getElementById("compare-btn") as HTMLButtonElement;
  let comparing = false;
  cmp.addEventListener("click", () => {
    comparing = !comparing;
    mm.toggleCompare(comparing);
    cmp.classList.toggle("active", comparing);
  });
  initSwipeDrag(mm);

  const meas = document.getElementById("measure-btn") as HTMLButtonElement;
  const measOut = document.getElementById("measure-out")!;
  let measuring = false;
  meas.addEventListener("click", () => {
    measuring = !measuring;
    if (measuring) {
      mm.startMeasure();
      measOut.textContent = "Click the map to add points…";
    } else {
      mm.stopMeasure();
      measOut.textContent = "";
    }
    meas.classList.toggle("active", measuring);
  });
}

function initSwipeDrag(mm: MapManager) {
  const handle = document.getElementById("swipe-handle")!;
  let dragging = false;
  const mapEl = document.getElementById("map")!;
  const move = (x: number) => {
    if (!dragging) return;
    const r = mapEl.getBoundingClientRect();
    mm.setSwipe(Math.min(1, Math.max(0, (x - r.left) / r.width)));
  };
  handle.addEventListener("mousedown", () => (dragging = true));
  window.addEventListener("mouseup", () => (dragging = false));
  window.addEventListener("mousemove", (e) => move(e.clientX));
  handle.addEventListener("touchstart", () => (dragging = true), { passive: true });
  window.addEventListener("touchend", () => (dragging = false));
  window.addEventListener("touchmove", (e) => move(e.touches[0].clientX), { passive: true });
}

export function initWildlife() {
  const list = document.getElementById("species-list")!;
  list.innerHTML = SPECIES.map((s) => `
    <div class="rounded-xl bg-slate-800/60 p-3">
      <div class="flex items-center gap-3">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-300">${s.name.charAt(0)}</span>
        <div class="min-w-0">
          <div class="font-semibold">${s.name}</div>
          <div class="truncate text-xs italic text-slate-400">${s.scientific}</div>
        </div>
        <span class="ml-auto shrink-0 rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">${s.status}</span>
      </div>
      <p class="mt-2 text-xs text-slate-300">${s.note}</p>
    </div>`).join("");
}

export function renderAbout() {
  const ul = document.getElementById("about-sources");
  if (ul)
    ul.innerHTML = [
      "Hansen Global Forest Change — Esri Living Atlas",
      "WDPA boundary — Protected Planet",
      "Rwanda land cover — RCMRD / RCoE Geoportal",
      "Algerian Forest Fires — Kaggle (ODC Public Domain)",
    ]
      .map(
        (s) =>
          `<li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"></span><span>${s}</span></li>`
      )
      .join("");
  const note = document.getElementById("about-note");
  if (note)
    note.textContent =
      "Data is real: WDPA boundary + Hansen Global Forest Change (263 loss polygons, 2001–2023) clipped to the park in Google Earth Engine. Forest cover 2000: 2,810 ha · loss: 309 ha.";
}

export function renderKmgbf() {
  const el = document.getElementById("kmgbf");
  if (!el) return;
  const pct = Math.round((KMGBF.remainingHa / KMGBF.forest2000Ha) * 100);
  el.innerHTML = `
    <div class="mb-1 text-xs font-semibold text-emerald-300">KMGBF Target 2 — halt &amp; reverse forest loss</div>
    <div class="h-3 w-full overflow-hidden rounded-full bg-slate-700">
      <div class="h-full rounded-full bg-emerald-500" style="width:${Math.min(100, pct)}%"></div>
    </div>
    <div class="mt-1 text-xs text-slate-300">${KMGBF.remainingHa.toLocaleString()} ha of ${KMGBF.forest2000Ha.toLocaleString()} ha forest retained since 2000 (~${pct}%). ${KMGBF.lossHa} ha lost — the restoration gap.</div>`;
}
