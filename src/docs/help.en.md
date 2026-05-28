# Basalt Tectonic Setting Discrimination System

> A geochemistry-driven tool for intelligent tectonic-setting classification of basalt samples.

![System workflow](geodan-workflow.png)

## 1. Background

Basalt is one of the most widespread and representative igneous rocks on Earth. Its chemical composition encodes key information about both the magma source and the tectonic setting in which it formed. From mid-ocean ridges to back-arc basins, from continental rifts to flood basalts, basalts formed in different tectonic settings exhibit recognizable major- and trace-element fingerprints.

For decades, geochemists have relied on empirical discrimination diagrams (Pearce diagrams, the Wood triangle, TAS, etc.) to assign basalts to a tectonic setting. These classic methods are intuitive in two or three dimensions but only use a handful of elements, struggle with non-linear boundaries in higher-dimensional element combinations, and lack quantitative confidence reporting.

As large geochemical databases such as GEOROC, PetDB and EarthChem have grown, machine learning and deep-learning approaches have become increasingly important for rock classification and tectonic-setting identification. Convolutional neural networks (CNNs) can automatically learn decision boundaries across tens of element features and report a calibrated confidence for every sample, providing a quantitative anchor for manual review.

## 2. What this system does

The core task: **given a table of major- and trace-element concentrations for a set of basalt samples, automatically classify each sample's tectonic setting and report the confidence.**

Concretely, the system:

- parses CSV / XLSX sample tables and matches the element columns automatically;
- checks data quality and imputes missing values using KNN or MissForest;
- performs anhydrous normalization of major elements and quantile standardization;
- runs a local ONNX CNN model to batch-predict one of 9 tectonic settings;
- presents the results in three coordinated views (table preview, statistics, map) and supports export.

The entire pipeline — including inference — runs locally in the browser, making it suitable for researchers handling unpublished or sensitive samples.

## 3. Value & significance

**For research** — The system bundles classic discrimination ideas, a modern machine-learning model and map visualization into a single tool, so researchers no longer need to switch between several pieces of software. A batch of samples is classified in seconds with consistent, reproducible results — particularly handy for first-pass screening of field samples, batch review of database-sourced compositions, and last-minute checks during paper revision.

**For teaching** — Clicking a sample on the map opens a popup with its element abundances, predicted label and confidence, directly linked to its geographic position. This makes the "element pattern ↔ tectonic setting" relationship far more tangible than a static discrimination diagram.

**For data governance** — Built-in steps for missing-value filtering, duplicate removal, anhydrous normalization and quantile standardization turn a raw uploaded table into a quality-controlled, comparable dataset, with intermediate columns preserved for traceability.

## 4. Data format

The system accepts CSV and XLSX files with a header row. The model needs **36 geochemical element columns** as input; the **LOI (Loss On Ignition)** column is optional and defaults to 0 when missing.

**Coordinate columns are optional**, but spatial views only render when both latitude and longitude are provided. Header matching is case-insensitive:

- Latitude: `LATITUDE` / `LAT` / `Y`
- Longitude: `LONGITUDE` / `LON` / `LONG` / `X`

**Data-cleaning rules**:

- empty cells, `-`, or non-numeric values are treated as missing;
- rows with more than 20 missing elements (~56%) are considered too sparse and removed;
- if two rows are byte-for-byte identical only the first is kept, to avoid double-counting;
- Archean cratonic samples (matched by filename keywords) are tagged for the imputation fallback.

## 5. Workflow

The system follows a four-step pipeline: **upload → preprocess → classify → review & export.**

**1. Upload**
Click "Re-upload" in the top-right or "Get started" on the home page to import a file. The system auto-detects the 36 element columns and the coordinate columns, and warns if anything required is missing.

**2. Preprocess**
Runs in order: missing-value imputation → anhydrous normalization → quantile standardization. Processed values are written back to the preview table so you can audit which fields participated in the downstream prediction.

**3. Classification**
Click "Predict". A local ONNX model batches the samples and returns a probability distribution over the 9 tectonic settings, then keeps the highest-probability label together with its confidence. Nothing leaves the browser.

**4. Review & export**
Switch to "Statistics" or "Spatial" to inspect the class distribution, confidence distribution and geographic distribution. Filter by setting or confidence threshold and export the results as CSV, the spatial CSV, the current map view, or a full-world basemap PNG.

## 6. The nine tectonic settings

The model assigns each sample its single highest-probability class — **it never outputs an "unknown / other" category.** The nine classes cover the principal tectonic backgrounds for modern basalts:

- **Spreading center (SPREADING_CENTER)** — global mid-ocean ridge system and ocean-spreading centers
- **Ocean island (OCEAN ISLAND)** — hotspot-related islands such as Hawaii or Réunion
- **Oceanic plateau (OCEANIC PLATEAU)** — submarine large igneous provinces such as Ontong Java or the Caribbean Plateau
- **Back-arc basin (BACK-ARC_BASIN)** — extensional basins behind subduction zones
- **Island arc (Island arc)** — volcanic island chains formed by oceanic subduction
- **Intra-oceanic arc (Intra-oceanic arc)** — arcs entirely built on oceanic crust
- **Continental arc (Continental arc)** — volcanic arcs along continental margins above subducting slabs
- **Continental rift (CONTINENTAL_RIFT)** — continental extensional zones such as the East African Rift or the Rhine Graben
- **Continental flood basalt (CONTINENTAL FLOOD BASALT)** — continental large igneous provinces such as Siberia or the Deccan Traps

Each class has a fixed colour defined in the `TECTONIC_COLORS` constant, kept consistent across the map and all charts.

## 7. Imputation: KNN vs MissForest

Database samples rarely cover all 36 elements, and the way missing values are filled has a direct impact on downstream prediction reliability. Two strategies are available:

**KNN (default)** — finds the nearest neighbours in the normalized training set and fills missing values with the neighbour mean. Fast and stable; sufficient for most modern basalts.

**MissForest (two-stage)** — first KNN-imputes the data → CNN produces a rough class label → a per-setting MissForest model re-imputes the original values using that label → re-normalize → CNN performs the final classification. Higher accuracy on heavily-incomplete samples at the cost of extra model files and longer runtime.

**Archean fallback** — when the filename matches Archean keywords, MissForest mode automatically falls back to plain KNN. MissForest was trained on modern basalts only and is not representative of Archean cratonic samples (e.g. Greenland Isua, Norseman & Kambalda in Western Australia).

## 8. Confidence & manual review

Confidence is the model's output probability for the top class, in the range 0–100%.

Empirically, **0.7 (70%)** is a sensible high-confidence threshold:

- **≥ 70%** — the model is reasonably certain about the assignment; can be taken at face value;
- **< 70%** — the model is hesitating between several settings; combine the prediction with geological context, sampling location, REE patterns and isotopic signatures before drawing a conclusion.

The spatial view provides a confidence-threshold slider so you can quickly hide low-confidence samples; the "Needs review" metric card in the statistics view shows how many samples fall below the threshold.

## 9. Spatial view

The map is rendered with [OpenLayers](https://openlayers.org/) using the **EPSG:4326 (equirectangular)** projection. Unlike the more common Web Mercator (EPSG:3857), under EPSG:4326 the world is naturally 2:1 and the poles are no longer dramatically stretched — much closer to true geography.

**Map controls** (top-left button column):

- fit-to-extent, fullscreen, current-view screenshot;
- **EPSG:4326 world basemap export** — server-side reprojection via ArcGIS returns a clean 4326 PNG without white bands: z3 → 4096×1935, z4 → 8192×3870, with optional sample-point overlay. Esri Ocean and Imagery only.

**Layers & filters panel** (top-right):

- tectonic-setting dropdown, confidence-threshold slider;
- clustering, colour-by-type and popup display toggles;
- layer management: sample points / terrain layer, etc.

**Interactions**:

- every floating card (basemap switch, legend, statistics trio, spatial filter panel, etc.) is draggable;
- clicking a sample dot opens a popup with its predicted label, confidence and main element abundances;
- the status bar shows live longitude / latitude, current zoom level and active basemap.

## 10. Exports

The system supports several export formats:

- **Result CSV** — all original element columns plus `Predicted_Setting` and `Confidence`;
- **Spatial CSV** — `INDEX / LATITUDE / LONGITUDE / Predicted_Setting / Confidence`, ready for GIS workflows;
- **Map screenshot** — PNG of the current map view including base layer and sample dots;
- **World basemap** — server-side reprojected EPSG:4326 PNG, optionally with sample-point overlay;
- **Result summary** — a short plain-text blurb you can paste into a paper or email.

## 11. Data privacy

**All sample data is parsed, preprocessed, classified and visualized locally in the browser.** Nothing is uploaded to a remote server, making the tool safe for unpublished or otherwise sensitive data.

The system contacts external public services only in these specific cases:

- loading OpenLayers basemap tiles (Esri, CartoDB);
- calling ArcGIS server-side reprojection for the EPSG:4326 world-basemap export.

These requests carry only tile-coordinate parameters; no sample composition data is transmitted.

## 12. FAQ

**Q: Why are some samples missing from the result?**
A: Possible reasons: (1) more than 20 missing elements and the row was dropped; (2) byte-identical to an earlier row and removed as a duplicate; (3) invalid latitude / longitude (still shows in the table but not on the map); (4) confidence below the current filter threshold.

**Q: Why aren't my samples on the map?**
A: Check that the table has `LATITUDE / LONGITUDE` columns with valid numeric values (non-empty, not `null`, not letters). Also check whether the current confidence threshold has filtered everything out.

**Q: The discrimination engine fails to load. What do I do?**
A: On first load the system has to fetch the ONNX runtime and CNN model over the network — make sure the browser can reach the public CDN. For corporate intranets, bundle the dependencies into the `public/` directory for offline serving.

**Q: Can it run offline?**
A: Inference itself is offline, but the first load needs network access. Once the resources are cached by the browser, it keeps working without a network.

**Q: Can I customize the tectonic classes?**
A: The current model is fixed at 9 classes. To extend the class list you need to retrain the CNN model and replace the weights under `public/model/`.
