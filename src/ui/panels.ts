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
    cmp.classList.toggle("bg-amber-500", comparing);
    cmp.classList.toggle("text-slate-900", comparing);
  });
  initSwipeDrag(mm);

  const meas = document.getElementById("measure-btn") as HTMLButtonElement;
  let measuring = false;
  meas.addEventListener("click", () => {
    measuring = !measuring;
    if (measuring) mm.startMeasure();
    else {
      mm.stopMeasure();
      document.getElementById("measure-out")!.textContent = "";
    }
    meas.classList.toggle("bg-amber-500", measuring);
    meas.textContent = measuring ? "📐 Click map… (tap to reset)" : "📐 Measure area";
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
      <div class="flex items-center gap-2">
        <span class="text-2xl">${s.emoji}</span>
        <div>
          <div class="font-semibold">${s.name}</div>
          <div class="text-xs italic text-slate-400">${s.scientific}</div>
        </div>
        <span class="ml-auto rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">${s.status}</span>
      </div>
      <p class="mt-2 text-xs text-slate-300">${s.note}</p>
    </div>`).join("");
}

export function renderKmgbf() {
  const el = document.getElementById("kmgbf");
  if (!el) return;
  const pct = Math.round((KMGBF.restoredHa / KMGBF.baselineHa) * 100);
  el.innerHTML = `
    <div class="mb-1 text-xs font-semibold text-emerald-300">KMGBF Target 2 — restore degraded ecosystems</div>
    <div class="h-3 w-full overflow-hidden rounded-full bg-slate-700">
      <div class="h-full rounded-full bg-emerald-500" style="width:${Math.min(100, pct)}%"></div>
    </div>
    <div class="mt-1 text-xs text-slate-300">${KMGBF.restoredHa.toLocaleString()} ha recovered of ${KMGBF.baselineHa.toLocaleString()} ha historic extent (~${pct}%).</div>`;
}
