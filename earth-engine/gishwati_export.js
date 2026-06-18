/**
 * Gishwati-Mukura — data export for the RCMRD Arts & Maps 2026 entry.
 *
 * Run this in the Google Earth Engine Code Editor: https://code.earthengine.google.com
 * It produces the real datasets your web app needs (replacing the samples):
 *   1. Forest-loss polygons (Hansen GFC) with a `loss_year` property
 *   2. An NDVI / vegetation-health image (Sentinel-2) — export as a layer
 *   3. Forest-cover stats per year (printed → paste into src/lib/data.ts)
 *
 * Datasets used (all map to approved competition sources):
 *   - Hansen Global Forest Change  (also on Esri Living Atlas)
 *   - Sentinel-2 surface reflectance
 *   - WDPA protected areas (boundary — also on Protected Planet)
 *
 * Esri Living Atlas + Protected Planet = 2+ approved sources ✓
 */

// ---------------------------------------------------------------------------
// 1. Area of interest — Gishwati-Mukura National Park (from WDPA in GEE)
// ---------------------------------------------------------------------------
// WDPA in Earth Engine: WCMC/WDPA/current/polygons
var wdpa = ee.FeatureCollection('WCMC/WDPA/current/polygons');
var aoi = wdpa.filter(ee.Filter.stringContains('NAME', 'Gishwati'));

// Fallback: if the name filter is empty, draw a rectangle around the park.
aoi = ee.FeatureCollection(ee.Algorithms.If(
  aoi.size().gt(0),
  aoi,
  ee.FeatureCollection([ee.Feature(
    ee.Geometry.Rectangle([29.30, -1.86, 29.43, -1.75]))])
));

Map.centerObject(aoi, 12);
Map.addLayer(aoi, {color: 'ffd166'}, 'AOI (Gishwati boundary)');

// ---------------------------------------------------------------------------
// 2. Hansen Global Forest Change — loss by year
// ---------------------------------------------------------------------------
var gfc = ee.Image('UMD/hansen/global_forest_change_2023_v1_11').clip(aoi);
var treecover2000 = gfc.select('treecover2000');
var lossYear = gfc.select('lossyear');          // 1..23  (=> 2001..2023)
var lossMask = gfc.select('loss');

Map.addLayer(treecover2000, {min: 0, max: 100, palette: ['000000', '00ff00']}, 'Tree cover 2000');
Map.addLayer(lossYear.updateMask(lossMask), {min: 1, max: 23, palette: ['ffe08a', 'f4a261', 'e63946']}, 'Forest loss year');

// Vectorize loss to polygons carrying loss_year (downscale to keep it light).
var lossYearFull = lossYear.add(2000).updateMask(lossMask).rename('loss_year').toInt();
var lossVectors = lossYearFull.reduceToVectors({
  geometry: aoi.geometry(),
  scale: 90,                 // coarser = fewer/smaller polygons; lower to 30 for detail
  geometryType: 'polygon',
  eightConnected: false,
  labelProperty: 'loss_year',
  maxPixels: 1e10
});

// ---------------------------------------------------------------------------
// 3. NDVI (Sentinel-2) — recent vegetation health
// ---------------------------------------------------------------------------
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .filterDate('2024-01-01', '2024-12-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .median()
  .clip(aoi);
var ndvi = s2.normalizedDifference(['B8', 'B4']).rename('NDVI');
Map.addLayer(ndvi, {min: 0, max: 0.9, palette: ['white', 'yellow', 'green']}, 'NDVI 2024');

// ---------------------------------------------------------------------------
// 4. Forest-cover stats (for the trend chart in src/lib/data.ts)
// ---------------------------------------------------------------------------
var pixelHa = ee.Image.pixelArea().divide(10000);
var forest2000 = treecover2000.gte(30).multiply(pixelHa).reduceRegion({
  reducer: ee.Reducer.sum(), geometry: aoi.geometry(), scale: 30, maxPixels: 1e10});
print('Forest area 2000 (>=30% cover), ha:', forest2000);

var totalLossHa = lossMask.multiply(pixelHa).reduceRegion({
  reducer: ee.Reducer.sum(), geometry: aoi.geometry(), scale: 30, maxPixels: 1e10});
print('Total loss 2001-2023, ha:', totalLossHa);

// ---------------------------------------------------------------------------
// 5. EXPORTS  (run the tasks from the "Tasks" tab, then download from Drive)
// ---------------------------------------------------------------------------
// 5a. Boundary -> rename to public/data/gishwati_boundary.geojson
Export.table.toDrive({
  collection: aoi, description: 'gishwati_boundary', fileFormat: 'GeoJSON'});

// 5b. Forest-loss polygons -> rename to public/data/forest_loss_sample.geojson
Export.table.toDrive({
  collection: lossVectors, description: 'forest_loss', fileFormat: 'GeoJSON'});

// 5c. NDVI raster (optional — add as a raster source / overlay image)
Export.image.toDrive({
  image: ndvi.multiply(100).toByte(), description: 'gishwati_ndvi_2024',
  region: aoi.geometry(), scale: 20, maxPixels: 1e10});

// Tip: after download, GeoJSON from GEE may be a FeatureCollection already —
// just drop it into public/data/ with the right filename. Confirm each loss
// feature has a numeric `loss_year` property (the app filters on it).
