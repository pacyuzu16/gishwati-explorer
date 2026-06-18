import { NDVI_SERIES, KMGBF } from "../lib/data";
import { icon } from "../lib/icons";

const PX_HA = 0.81; // ha per 90 m loss pixel

interface Insight {
  iconName: string;
  tone: "good" | "bad" | "neutral";
  title: string;
  body: string;
}

/** Compute findings from the real loss + NDVI data and render an insights card. */
export async function renderInsights() {
  const el = document.getElementById("insights");
  if (!el) return;

  const gj = await fetch("data/forest_loss.geojson").then((r) => r.json());
  const byYear = new Map<number, number>();
  for (const f of gj.features) {
    const y = f.properties.loss_year as number;
    byYear.set(y, (byYear.get(y) ?? 0) + (f.properties.count ?? 1) * PX_HA);
  }

  // Peak loss year
  let peakYear = 0, peakHa = 0;
  byYear.forEach((ha, y) => { if (ha > peakHa) { peakHa = ha; peakYear = y; } });

  // Loss rate before / after 2015 gazettement
  let pre = 0, post = 0;
  byYear.forEach((ha, y) => { (y <= 2014 ? (pre += ha) : (post += ha)); });
  const preRate = pre / 14, postRate = post / 9;

  // NDVI greening since 2016 low
  const v = NDVI_SERIES.values;
  const low = Math.min(...v);
  const peakNdvi = Math.max(...v);
  const greenPct = ((peakNdvi - low) / low) * 100;

  const insights: Insight[] = [
    {
      iconName: "leaf",
      tone: "good",
      title: `Canopy is greening (+${greenPct.toFixed(0)}%)`,
      body: `Mean NDVI rose from ${low.toFixed(3)} (2016 low) to ${peakNdvi.toFixed(3)} — restoration is densifying the canopy.`,
    },
    {
      iconName: "trendingDown",
      tone: "bad",
      title: `Clearing has not stopped`,
      body: `Loss averaged ${preRate.toFixed(1)} ha/yr before gazettement (2015) and ${postRate.toFixed(1)} ha/yr after — protection slowed, but did not halt, clearing.`,
    },
    {
      iconName: "flame",
      tone: "neutral",
      title: `Peak loss in ${peakYear}`,
      body: `${peakHa.toFixed(0)} ha cleared in ${peakYear} — the single worst year, underscoring continued pressure.`,
    },
    {
      iconName: "leaf",
      tone: KMGBF.remainingHa / KMGBF.forest2000Ha > 0.85 ? "good" : "neutral",
      title: `${Math.round((KMGBF.remainingHa / KMGBF.forest2000Ha) * 100)}% of forest retained`,
      body: `${KMGBF.remainingHa.toLocaleString()} of ${KMGBF.forest2000Ha.toLocaleString()} ha remain — a recoverable base for KMGBF Target 2.`,
    },
  ];

  const toneCls: Record<string, string> = {
    good: "text-emerald-400",
    bad: "text-red-400",
    neutral: "text-amber-400",
  };

  el.innerHTML =
    `<div class="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">${icon("cpu", "h-4 w-4 text-emerald-400")} Key insights <span class="text-[10px] font-normal text-slate-500">auto-generated from the data</span></div>` +
    insights
      .map(
        (i) => `
      <div class="mb-2 flex gap-3 rounded-lg bg-slate-800/60 p-3">
        <span class="${toneCls[i.tone]} mt-0.5 shrink-0">${icon(i.iconName, "h-5 w-5")}</span>
        <div>
          <div class="text-sm font-semibold ${toneCls[i.tone]}">${i.title}</div>
          <div class="mt-0.5 text-xs text-slate-300">${i.body}</div>
        </div>
      </div>`
      )
      .join("");
}
