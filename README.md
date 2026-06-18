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
- **Inline SVG icon set** (`src/lib/icons.ts`, Lucide-style) — no emoji
- **In-browser ML**: logistic-regression fire-risk model, no ML runtime

## Features
A **landing page** introduces the story; "Enter the Explorer" opens the app.

| Tab | What it does |
|-----|--------------|
| Layers | Toggle + opacity per layer, basemap switch, **compare swipe**, **measure area** |
| Time | Year slider with **play animation**; live loss readout |
| Stats | Forest-cover trend, loss-by-year bar, **KMGBF tracker** (real EE figures) |
| Wildlife | Species spotlight cards (chimp, golden monkey, crane…) |
| Fire-risk | **ML model** — predict wildfire likelihood from weather (see below) |
| About | Narrative + data-source attribution |

Plus a **guided tour** that flies through the restoration story, light/dark
theme, share + map-image export.

## Machine learning — climate fire-risk
`ml/train_fire_model.py` trains a logistic-regression classifier on the
**Algerian Forest Fires Dataset** (featured on Kaggle; ODC Public Domain,
sourced from the public UCI mirror). It predicts *fire / not-fire* from weather
(temperature, humidity, wind, rain), evaluates on an 80/20 split (~78% test
accuracy), and exports weights to `public/model/fire_model.json`.

The browser loads those weights (`src/lib/fireModel.ts`) and runs inference live
as you move the sliders — **no TensorFlow.js / heavy runtime, tiny payload**.
It ties the climate theme to the forest: hotter, drier weather → higher fire
risk to the recovering canopy.

Retrain / refresh:
```bash
curl -sL -o /tmp/algerian.csv \
  "https://archive.ics.uci.edu/ml/machine-learning-databases/00547/Algerian_forest_fires_dataset_UPDATE.csv"
python3 ml/train_fire_model.py /tmp/algerian.csv   # rewrites public/model/fire_model.json
```

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
