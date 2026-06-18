import { STORY } from "../lib/data";
import type { MapManager } from "../map/MapManager";

export function initStory(mm: MapManager) {
  const overlay = document.getElementById("story-overlay")!;
  const titleEl = document.getElementById("story-title")!;
  const textEl = document.getElementById("story-text")!;
  const stepEl = document.getElementById("story-step")!;
  document.getElementById("story-total")!.textContent = String(STORY.length);

  let i = 0;
  const render = () => {
    const s = STORY[i];
    titleEl.textContent = s.title;
    textEl.textContent = s.text;
    stepEl.textContent = String(i + 1);
    mm.flyTo(s.center, s.zoom);
    (document.getElementById("story-prev") as HTMLButtonElement).disabled = i === 0;
    (document.getElementById("story-next") as HTMLButtonElement).textContent = i === STORY.length - 1 ? "Finish" : "Next";
  };
  const open = () => { overlay.classList.remove("hidden"); i = 0; render(); };
  const close = () => overlay.classList.add("hidden");

  document.getElementById("story-btn")!.addEventListener("click", open);
  document.getElementById("story-close")!.addEventListener("click", close);
  document.getElementById("story-prev")!.addEventListener("click", () => { if (i > 0) { i--; render(); } });
  document.getElementById("story-next")!.addEventListener("click", () => {
    if (i < STORY.length - 1) { i++; render(); } else close();
  });
}
