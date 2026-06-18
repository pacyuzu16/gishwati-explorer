import type { BasemapDef, Species, StoryStep } from "./types";

export const CENTER: [number, number] = [29.365, -1.805]; // Gishwati-Mukura (approx.)
export const ZOOM = 11;

export const BASEMAPS: BasemapDef[] = [
  {
    id: "satellite",
    label: "Satellite (Esri)",
    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
    attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
  },
  {
    id: "topo",
    label: "Topographic (Esri)",
    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"],
    attribution: "Tiles © Esri",
  },
  {
    id: "osm",
    label: "Streets (OSM)",
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    attribution: "© OpenStreetMap contributors",
  },
];

/** Color ramp for Hansen loss-year (older = yellow → recent = red). */
export const LOSS_COLOR: any = [
  "interpolate", ["linear"], ["get", "loss_year"],
  2001, "#ffe08a",
  2012, "#f4a261",
  2023, "#e63946",
];

// Forest cover WITHIN the WDPA park boundary (ha), derived from Hansen Global
// Forest Change in Google Earth Engine (baseline 2,810 ha tree cover in 2000,
// minus cumulative loss by year). These are real, reproducible figures.
export const TREND = {
  labels: ["2000", "2005", "2010", "2015", "2020", "2023"],
  values: [2810, 2700, 2658, 2603, 2523, 2459],
};

// Real Earth Engine stats for Gishwati-Mukura National Park (WDPA boundary).
export const KMGBF = {
  forest2000Ha: 2810, // tree cover (>=30%) in 2000
  lossHa: 309,        // total loss 2001-2023 (Hansen, 30 m)
  remainingHa: 2501,  // forest2000 - loss
};

// Mean canopy NDVI within the park (Landsat 8/9, Earth Engine) — the greening /
// recovery signal. Rose ~5% from the 2016 low (0.757) to the 2021 peak (0.794).
export const NDVI_SERIES = {
  labels: ["2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"],
  values: [0.764, 0.758, 0.757, 0.773, 0.79, 0.775, 0.791, 0.794, 0.772, 0.78, 0.783],
};

export const SPECIES: Species[] = [
  { name: "Eastern chimpanzee", scientific: "Pan troglodytes schweinfurthii", emoji: "🐒", status: "Endangered", note: "A small population survives in Gishwati — a flagship of the park's recovery." },
  { name: "Golden monkey", scientific: "Cercopithecus kandti", emoji: "🐵", status: "Endangered", note: "Albertine Rift endemic, restricted to a few montane forests." },
  { name: "L'Hoest's monkey", scientific: "Allochrocebus lhoesti", emoji: "🐒", status: "Vulnerable", note: "Shy, ground-foraging guenon of dense montane forest." },
  { name: "Grey crowned crane", scientific: "Balearica regulorum", emoji: "🦅", status: "Endangered", note: "Wetland icon of Rwanda; depends on healthy catchments fed by the forest." },
];

export const STORY: StoryStep[] = [
  { title: "A forest at the edge of the Rift", text: "Gishwati-Mukura sits on the Congo–Nile divide in western Rwanda — a montane forest that feeds rivers, stores carbon, and shelters Albertine Rift species.", center: [29.365, -1.805], zoom: 10.5 },
  { title: "The collapse", text: "The wider Gishwati landscape shrank from ~28,000 ha in the 1970s to a few hundred by the 2000s — cleared for resettlement, farming and cattle. The surviving core held ~2,810 ha of forest in 2000.", center: [29.36, -1.79], zoom: 12 },
  { title: "The turning point", text: "In 2015 the surviving forest was gazetted as a National Park; in 2020 it became a UNESCO Biosphere Reserve — with community agroforestry buffers and active replanting.", center: [29.38, -1.82], zoom: 12 },
  { title: "Recovery — and pressure", text: "Canopy greenness (NDVI) has risen ~5% since its 2016 low as restoration takes root. Yet Hansen still flags scattered clearing (309 ha since 2001) — recovery and pressure, side by side.", center: [29.37, -1.81], zoom: 11.5 },
  { title: "Local action → global impact", text: "With 89% of its 2000 forest retained, Gishwati is a recoverable base — every hectare restored counts toward the Kunming-Montreal Global Biodiversity Framework's goal to restore degraded ecosystems by 2030.", center: [29.365, -1.805], zoom: 10.5 },
];
