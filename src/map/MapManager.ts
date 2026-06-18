import maplibregl, { Map as MlMap, Popup, LngLatBounds } from "maplibre-gl";
import area from "@turf/area";
import { polygon } from "@turf/helpers";
import { BASEMAPS, CENTER, ZOOM, LOSS_COLOR } from "../lib/data";
import type { LayerDef } from "../lib/types";

const BOUNDARY_URL = "data/gishwati_boundary.geojson";
const LOSS_URL = "data/forest_loss.geojson";

export class MapManager {
  map: MlMap;
  private compare: MlMap | null = null;
  private basemapId = "satellite";
  private measuring = false;
  private measurePts: [number, number][] = [];

  readonly layers: LayerDef[] = [
    { id: "boundary-line", label: "Park boundary (WDPA)", visible: true, swatch: "#ffd166" },
    { id: "landcover-fill", label: "Land cover (RCMRD)", visible: false, swatch: "#2a9d8f" },
    { id: "loss-fill", label: "Forest loss (Hansen)", visible: true, swatch: "#e63946" },
  ];

  constructor(container: string) {
    this.map = new maplibregl.Map({
      container,
      style: this.style("satellite"),
      center: CENTER,
      zoom: ZOOM,
      attributionControl: { compact: true },
      preserveDrawingBuffer: true, // required so we can export the map as a PNG
    });
    this.map.addControl(new maplibregl.NavigationControl(), "top-right");
    this.map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right");
    this.map.on("load", () => this.addOverlays());
  }

  private style(id: string): any {
    const b = BASEMAPS.find((x) => x.id === id)!;
    return {
      version: 8,
      sources: { basemap: { type: "raster", tiles: b.tiles, tileSize: 256, attribution: b.attribution } },
      layers: [{ id: "basemap", type: "raster", source: "basemap" }],
    };
  }

  private addOverlays() {
    if (this.map.getSource("boundary")) return; // already added (after basemap swap)

    this.map.addSource("boundary", { type: "geojson", data: BOUNDARY_URL });
    this.map.addLayer({ id: "boundary-line", type: "line", source: "boundary", paint: { "line-color": "#ffd166", "line-width": 3 } });
    this.map.addLayer({ id: "landcover-fill", type: "fill", source: "boundary", layout: { visibility: "none" }, paint: { "fill-color": "#2a9d8f", "fill-opacity": 0.35 } });

    this.map.addSource("loss", { type: "geojson", data: LOSS_URL });
    this.map.addLayer({ id: "loss-fill", type: "fill", source: "loss", paint: { "fill-color": LOSS_COLOR, "fill-opacity": 0.85, "fill-outline-color": "#7a0c14" } });

    // restore visibility state across basemap swaps
    this.layers.forEach((l) => this.setVisible(l.id, l.visible));

    this.map.on("click", "loss-fill", (e) => {
      const p = e.features![0].properties as any;
      const ha = p.count != null ? (p.count * 0.81).toFixed(1) + " ha" : "—";
      new Popup().setLngLat(e.lngLat).setHTML(
        `<strong>Forest loss</strong><br>Loss year: <strong>${p.loss_year}</strong><br>Patch area: ${ha}`
      ).addTo(this.map);
    });
    this.map.on("mouseenter", "loss-fill", () => (this.map.getCanvas().style.cursor = "pointer"));
    this.map.on("mouseleave", "loss-fill", () => (this.map.getCanvas().style.cursor = ""));

    this.map.on("click", (e) => this.onMeasureClick([e.lngLat.lng, e.lngLat.lat]));

    fetch(BOUNDARY_URL).then((r) => r.json()).then((gj) => {
      const b = new LngLatBounds();
      // Walk coordinates of ANY geometry type (Polygon, MultiPolygon, …).
      const walk = (coords: any) => {
        if (typeof coords[0] === "number") b.extend(coords as [number, number]);
        else (coords as any[]).forEach(walk);
      };
      gj.features.forEach((f: any) => walk(f.geometry.coordinates));
      if (!b.isEmpty()) this.map.fitBounds(b, { padding: 60, duration: 0 });
    });
  }

  setVisible(layerId: string, visible: boolean) {
    const l = this.layers.find((x) => x.id === layerId);
    if (l) l.visible = visible;
    if (this.map.getLayer(layerId)) this.map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
  }

  setOpacity(layerId: string, value: number) {
    if (!this.map.getLayer(layerId)) return;
    const prop = layerId.endsWith("-line") ? "line-opacity" : "fill-opacity";
    this.map.setPaintProperty(layerId, prop as any, value);
  }

  /** Filter forest loss to features at or before `year`; returns the count shown. */
  filterYear(year: number): number {
    if (!this.map.getLayer("loss-fill")) return 0;
    this.map.setFilter("loss-fill", ["<=", ["get", "loss_year"], year]);
    const feats = (this.map.querySourceFeatures("loss") as any[]).filter((f) => f.properties.loss_year <= year);
    return feats.length;
  }

  setBasemap(id: string) {
    this.basemapId = id;
    const c = this.map.getCenter();
    const z = this.map.getZoom();
    this.map.setStyle(this.style(id));
    this.map.once("styledata", () => {
      this.map.jumpTo({ center: c, zoom: z });
      this.addOverlays();
    });
  }

  flyTo(center: [number, number], zoom: number) {
    this.map.flyTo({ center, zoom, duration: 1500, essential: true });
  }

  bbox(): [number, number, number, number] {
    const b = this.map.getBounds();
    return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
  }

  /** Download the current map view as a PNG (for sharing / People's Choice). */
  exportImage(filename = "gishwati-restoration.png") {
    this.map.redraw();
    const url = this.map.getCanvas().toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }

  /* ---- Compare (swipe) ---- */
  toggleCompare(on: boolean) {
    const area = document.getElementById("map-compare")!;
    const handle = document.getElementById("swipe-handle")!;
    area.classList.toggle("hidden", !on);
    handle.classList.toggle("hidden", !on);
    if (on) {
      this.compare = new maplibregl.Map({ container: "map-compare", style: this.style(this.basemapId), center: this.map.getCenter(), zoom: this.map.getZoom(), interactive: false });
      this.map.on("move", this.syncCompare);
      this.setSwipe(0.5);
    } else if (this.compare) {
      this.map.off("move", this.syncCompare);
      this.compare.remove();
      this.compare = null;
    }
  }
  private syncCompare = () => {
    this.compare?.jumpTo({ center: this.map.getCenter(), zoom: this.map.getZoom(), bearing: this.map.getBearing(), pitch: this.map.getPitch() });
  };
  setSwipe(frac: number) {
    const area = document.getElementById("map")!;
    const w = area.clientWidth;
    const x = w * frac;
    document.getElementById("swipe-handle")!.style.left = x + "px";
    document.getElementById("map-compare")!.style.clipPath = `inset(0 ${w - x}px 0 0)`;
  }

  /* ---- Measure tool ---- */
  startMeasure() {
    this.measuring = true;
    this.measurePts = [];
    this.map.getCanvas().style.cursor = "crosshair";
  }
  stopMeasure() {
    this.measuring = false;
    this.measurePts = [];
    this.map.getCanvas().style.cursor = "";
    if (this.map.getLayer("measure-fill")) this.map.removeLayer("measure-fill");
    if (this.map.getLayer("measure-line")) this.map.removeLayer("measure-line");
    if (this.map.getSource("measure")) this.map.removeSource("measure");
  }
  private onMeasureClick(pt: [number, number]) {
    if (!this.measuring) return;
    this.measurePts.push(pt);
    const ring = [...this.measurePts, this.measurePts[0]];
    const gj: any = { type: "Feature", geometry: { type: "Polygon", coordinates: [ring] }, properties: {} };
    if (this.map.getSource("measure")) {
      (this.map.getSource("measure") as any).setData(gj);
    } else {
      this.map.addSource("measure", { type: "geojson", data: gj });
      this.map.addLayer({ id: "measure-fill", type: "fill", source: "measure", paint: { "fill-color": "#e9a800", "fill-opacity": 0.25 } });
      this.map.addLayer({ id: "measure-line", type: "line", source: "measure", paint: { "line-color": "#e9a800", "line-width": 2 } });
    }
    if (this.measurePts.length >= 3) {
      const ha = area(polygon([ring])) / 10000;
      const out = document.getElementById("measure-out");
      if (out) out.textContent = `Area: ${ha.toLocaleString(undefined, { maximumFractionDigits: 1 })} ha (${this.measurePts.length} points · click to add, button to reset)`;
    }
  }
}
