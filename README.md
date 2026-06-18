# Gishwati Restoration Explorer

Interactive web-map application for the **RCMRD Arts & Maps Competition 2026**
(Professional category → Forestry). Theme: *Acting Locally for Global Impact.*

Subject: **Gishwati-Mukura National Park, Rwanda** — a montane forest that
collapsed to ~600 ha by 2002 and is recovering — linked to the global
**Kunming-Montreal Global Biodiversity Framework (Target 2)**.

## Stack
- **Vite + TypeScript** (modular: `src/map`, `src/ui`, `src/lib`)
- **Tailwind CSS v4** (responsive: desktop sidebar ↔ mobile bottom sheet)
- **MapLibre GL JS** (maps), **Chart.js** (stats), **Turf** (area measure)
- **ML-ready**: `src/lib/ml.ts` is a `MlProvider` interface stubbed for
  TensorFlow.js / ONNX Runtime Web

## Features
| Tab | What it does |
|-----|--------------|
| 🗂️ Layers | Toggle + opacity per layer, basemap switch, **compare swipe**, **measure area** |
| ⏱️ Time | Year slider with **play animation**; live loss readout |
| 📊 Stats | Forest-cover trend, loss-by-year bar, **KMGBF 30×30 tracker** |
| 🦍 Wildlife | Species spotlight cards (chimp, golden monkey, crane…) |
| 🧠 Analysis | **NDVI** (live band-math hook) + **deforestation-risk** model stub |
| ℹ️ About | Narrative + data-source attribution |

Plus a **guided tour** (▶ Tour) that flies through the restoration story, and a
light/dark theme toggle.

## Develop
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle in dist/
npm run preview  # preview the build
```

## Deploy free (your submission URL)
- **GitHub Pages**: build, then publish `dist/` (or use a Pages action). `base`
  is already `./` for project sites.
- **Vercel / Netlify**: import the repo; build command `npm run build`, output `dist`.

---

## ✅ Real data is loaded (eligibility met)
`public/data/` now holds **real** datasets pulled via Google Earth Engine:
- `gishwati_boundary.geojson` — official **WDPA** boundary (Protected Planet)
- `forest_loss.geojson` — **Hansen Global Forest Change** (263 loss polygons, 2001–2023)

Plus Rwanda land cover (RCMRD) as the optional third layer → **≥2 approved sources ✓**.
Real stats: forest cover 2000 = **2,810 ha**, loss 2001–2023 = **309 ha**.

The Earth Engine script that produced these is in `earth-engine/gishwati_export.js`.

### To refresh or extend the data, swap files in `public/data/`:

1. **Park boundary** → [Protected Planet](https://protectedplanet.net) → search
   "Gishwati-Mukura" → save as `gishwati_boundary.geojson` (keep `wdpa_id`).
2. **Forest loss** → Esri Living Atlas (Hansen Global Forest Change). Clip
   `UMD/hansen/global_forest_change` to the boundary in Google Earth Engine;
   export `lossyear` polygons → `forest_loss_sample.geojson` (keep `loss_year`),
   or export raster tiles and add a `raster` source in `MapManager`.
3. **Land cover** → [RCMRD Geoportal](https://geoportal.rcmrd.org) → Rwanda land
   cover; replace the `landcover-fill` placeholder.
4. Update `TREND` / `KMGBF` numbers in `src/lib/data.ts` with real hectares.

## Adding a real ML model later
`src/lib/ml.ts` implements `MlProvider`. Replace `StubMlProvider` with a class
that loads a model (`tf.loadLayersModel(...)` or `ort.InferenceSession.create(...)`),
builds an input tensor from tiles in the given `bbox`, and returns an `MlResult`.
The UI already calls `ndvi()` and `deforestationRisk()` — no UI changes needed.
