# Historical Surface Urban Heat Island

**Historical Surface Urban Heat Island** (`historysuhi`) is the Talea Project web platform for reading Bologna's surface urban heat patterns from satellite-derived data products.

Live app: <https://talea.comune.bologna.it/historysuhi/#2.v1.yc.l0>

[English](#english) | [Italiano](#italiano)

## English

### Contents

- [Overview](#overview)
- [Repository Layout](#repository-layout)
- [Data And Methods](#data-and-methods)
- [Core Indicators](#core-indicators)
- [Application Views](#application-views)
- [Data Inventory](#data-inventory)
- [Data Pipeline](#data-pipeline)
- [Localization And URL State](#localization-and-url-state)
- [Limitations](#limitations)
- [Deployment](#deployment)
- [License](#license)

### Overview

The application turns a 2013-2025 Landsat 8/9 archive and a 2025 MODIS day-night product into citizen-readable maps, summaries, and area comparisons. It focuses on **land surface temperature**: the temperature of roofs, roads, vegetation, paved areas, and other surfaces observed from above.

The purpose is to move beyond a single thermal snapshot. The platform shows where Bologna is hot in absolute terms, where heat is persistent across years, where 2025 diverges from local historical behavior, and which physical drivers help explain the pattern.

The public interface is organized as a five-step narrative. Each step combines a map with focused controls, inspection tools, and supporting summaries so the same dataset can be read at pixel, district, and statistical-area scale.

### Repository Layout

| Path | Purpose |
| --- | --- |
| `webapp/` | React and Vite web application. |
| `webapp/src/components/views/` | The five narrative application views. |
| `webapp/src/components/map/` | MapLibre maps, raster map cards, legends, tooltips, and inspection UI. |
| `webapp/src/components/panels/` | Tables, scatter plots, detail cards, and area search. |
| `webapp/src/data/` | Layer metadata, view copy, and statistical-area metrics. |
| `webapp/src/i18n/` | Italian and English localization helpers and copy overrides. |
| `webapp/src/store/appStore.js` | Shared Zustand state for language, view, layer, year, thresholds, comparison, aggregation, and map controls. |
| `webapp/data/` | Static geospatial and tabular assets served by the app. |
| `webapp/scripts/` | Build and data-preparation helper scripts. |
| `webapp/docs/` | Talea logo assets imported by the app. |
| `code/00_data_pipeline.ipynb` | Reproducible data workflow for Earth Engine exports and local processing. |
| `LICENSE` | Project license file. |

### Data And Methods

All analytical data are extracted or computed from Google Earth Engine, then exported into `webapp/data/` for static delivery by the React/Vite frontend. The webapp does not recompute the full geospatial pipeline; it renders exported rasters and vectors, with lightweight browser-side display transforms where needed.

The Landsat-derived thermal layers use 30 m summer composites for 2013-2025. These support annual LST maps, climatology, anomaly, z-score, hotspot, persistence, and the temperature component of the synthetic indices. The standalone 2025 albedo layer is derived from Sentinel-2 at 10 m; HRI and UHEI remain at 30 m because they include Landsat temperature, with albedo area-averaged from 10 m onto the thermal grid. The MODIS-derived layer uses a 1 km 2025 day-night product to describe the surface thermal range between daytime and nighttime observations.

The main seasonal window is June 1 to August 31. Cloudy or unusable satellite observations are excluded.

### Core Indicators

| Indicator | What it describes | Resolution / scope | Main source |
| --- | --- | --- | --- |
| LST | Median summer land surface temperature. | Landsat 30 m, 2013-2025. | `data/gee_lst/Bologna_LST_{year}_summer_median_30m.tif` |
| Spatial z-score | Within-year deviation from Bologna's urban mean. | Landsat 30 m, each year. | Computed from yearly LST rasters. |
| Climatology | Mean summer LST across 2013-2025. | Landsat 30 m. | `data/webapp_rasters/climatology_mean_2013_2025_30m.tif` |
| 2025 anomaly | 2025 LST compared with each pixel's own baseline. | Landsat 30 m. | `data/webapp_rasters/anomaly_2025_summer_30m.tif` |
| Temporal persistence | Count of summers where a pixel is anomalous against its own history. | Landsat 30 m, observed count 0-5. | `data/webapp_rasters/hotspot_temporal_persistence_2013_2025.tif` |
| Structural persistence | Count of summers where a pixel is in the citywide top 5% LST. | Landsat 30 m, count 0-13. | `data/webapp_rasters/hotspot_structural_persistence_2013_2025.tif` |
| UHEI / HVI / HRI | Synthetic indices linking heat, vegetation, and albedo. HRI and UHEI use the new albedo averaged to the thermal grid. | 30 m, 2025. | `data/webapp_rasters/UHEI_2025_summer_30m.tif`, `HVI`, `HRI` |
| NDVI | Vegetation presence and density. | Sentinel-2-derived 2025 layer on the 30 m webapp grid. | `data/webapp_rasters/NDVI_2025_summer_30m.tif` |
| Albedo | Surface reflectance. Only source bands native at 20 m were interpolated to 10 m upstream. | Sentinel-2 10 m, 2025. | `data/webapp_rasters/Albedo_2025_summer_10m.tif` |
| Day-night delta | Surface temperature range between day and night. | MODIS 1 km, 2025. | `data/webapp_rasters/DeltaLST_2025_summer_1km.tif` |
| Zonal metrics | Mean values by district or statistical area. | 6 districts, 90 statistical areas. | `data/webapp_vectors/districts_enriched_2025.geojson`, `src/data/statisticalAreas.js` |

### Application Views

| View | Question answered | Main content |
| --- | --- | --- |
| 1. Dove fa caldo | Where is the surface hottest in the selected year? | Annual LST, spatial z-score, year slider, compare modal, temporal-hotspot overlay. |
| 2. Cosa è normale, cosa è cambiato | What is habitual, persistent, or anomalous in the 2013-2025 record? | Climatology, 2025 anomaly, temporal and structural persistence, chronic/anomalous categories. |
| 3. Perché fa caldo qui | Which physical conditions help explain heat concentration? | UHEI, HVI, HRI, NDVI, and Albedo on the 2025 baseline. |
| 4. Giorno e notte | Where does the surface cool more or less between day and night? | MODIS day-night delta map and scatter relationships with albedo or NDVI. |
| 5. Zoom sui quartieri | How do districts and statistical areas compare? | District/statistical-area aggregation, sortable table, search, map inspection, detail card. |

#### View 1: Where It Gets Hot

This view reads the annual surface temperature archive. Its logic is: first show the absolute temperature of the selected summer, then offer a standardized view of internal urban differences, then optionally highlight places that were anomalous against their own history.

**Annual LST layer**

- Calculates the selected year's summer median land surface temperature at each pixel.
- Formula:  
  $$L(x,y,t)$$
- High values identify surfaces that were hottest in absolute terms in year `t`. The compare modal keeps the same LST scale across two years so the visual comparison remains consistent.

**Spatial z-score layer**

- Calculates how far each pixel is above or below Bologna's average in the same year.
- Formula:  
  $$z_s(x,y,t) = \frac{L(x,y,t) - \mu_C(t)}{\sigma_C(t)}$$
- `0` means close to the citywide mean for that year, positive values are warmer than the city average, and negative values are cooler. This is not a temperature in degrees.

**Temporal anomaly overlay**

- Calculates whether a pixel is unusually hot compared with its own 2013-2025 behavior.
- Formula:  
  $$z_t(x,y,t) = \frac{L(x,y,t) - \mu_P(x,y)}{\sigma_P(x,y)}$$
  $$H_t(x,y,t) = \mathbb{1}\left[z_t(x,y,t) \geq 1.0\right]$$
- The overlay does not simply mark the hottest surfaces. It marks places where the selected year is high relative to that same pixel's normal behavior.

Main data: `data/gee_lst/Bologna_LST_{year}_summer_median_30m.tif`, `data/hotspots/hotspot_temporal_{year}_zgt1p0.tif`, and `data/csv_info/LST_yearly_input_summary_median_30m.csv`.

#### View 2: What Is Normal, What Changed

This view shifts from single-year reading to the full 2013-2025 history. The sequence is baseline first, 2025 departure second, recurrence third, and combined interpretation last.

**Climatology**

- Calculates the long-term summer mean LST of each pixel.
- Formula:  
  $$\mu_P(x,y) = \frac{1}{N} \sum_{t=2013}^{2025} L(x,y,t), \qquad N = 13$$
- A hot value means a surface is habitually hot, not necessarily anomalous.

**2025 anomaly**

- Calculates the 2025 departure from the same pixel's climatology.
- Formula:  
  $$A_{2025}(x,y) = L(x,y,2025) - \mu_P(x,y)$$
- Positive values mean 2025 was warmer than that pixel's normal behavior; negative values mean it was cooler.

**Structural persistence**

- Counts how many years a pixel was in the hottest 5% of Bologna for that year.
- Formula:  
  $$H_s(x,y,t) = \mathbb{1}\left[L(x,y,t) \geq P_{95}(L(\cdot,\cdot,t))\right]$$
  $$P_s(x,y) = \sum_{t=2013}^{2025} H_s(x,y,t)$$
- High values identify chronic heat locations that repeatedly rank among the city's hottest surfaces.

**Temporal persistence**

- Counts how many years a pixel was unusually hot compared with its own history.
- Formula:  
  $$H_t(x,y,t) = \mathbb{1}\left[z_t(x,y,t) \geq 1.0\right]$$
  $$P_t(x,y) = \sum_{t=2013}^{2025} H_t(x,y,t)$$
- A place can be structurally hot but not temporally anomalous if it is hot in a stable, recurring way.

Main data: `data/webapp_rasters/climatology_mean_2013_2025_30m.tif`, `data/webapp_rasters/anomaly_2025_summer_30m.tif`, persistence rasters, hotspot combination rasters, and supporting CSV summaries in `data/csv_info/`.

#### View 3: Why It Gets Hot Here

This view explains the 2025 physical context behind heat accumulation. All layers use the same summer 2025 baseline, so surface temperature, vegetation, and reflectance can be compared without mixing years.

The standalone albedo map keeps the native 10 m output grid. HRI and UHEI stay on the 30 m Landsat thermal grid: before those indices are calculated, the 10 m albedo cells are aggregated with an area mean. This avoids presenting the temperature component as if it had 10 m information.

**Normalization**

- Rescales each input layer inside Bologna to a common 0-1 range before combining them.
- Formula:  
  $$X_{\mathrm{norm}}(x,y) = \frac{X(x,y) - \min_{\Omega} X}{\max_{\Omega} X - \min_{\Omega} X}$$
- Normalization makes LST, NDVI, and Albedo comparable as index inputs. It does not turn them into physical units.

**UHEI: combined exposure**

- Combines high surface temperature, low vegetation, and low reflectance.
- Formula:  
  $$\mathrm{UHEI}(x,y) = L_{\mathrm{norm}}(x,y) + \left(1 - \mathrm{NDVI}_{\mathrm{norm}}(x,y)\right) + \left(1 - \alpha_{\mathrm{norm}}(x,y)\right)$$
- Higher values mark places where the three physical conditions reinforce one another. UHEI is an index, not a temperature.

**HVI and HRI**

- Formula:  
  $$\mathrm{HVI}(x,y) = L_{\mathrm{norm}}(x,y) - \mathrm{NDVI}_{\mathrm{norm}}(x,y)$$
  $$\mathrm{HRI}(x,y) = L_{\mathrm{norm}}(x,y) - \alpha_{\mathrm{norm}}(x,y)$$
- HVI highlights where high heat and low vegetation coincide; HRI highlights where high heat and low reflectance coincide.
- NDVI and Albedo remain available as standalone layers because the composite indices should be interpreted through their components.

Main data: `data/webapp_rasters/UHEI_2025_summer_30m.tif`, `HVI_2025_summer_30m.tif`, `HRI_2025_summer_30m.tif`, `NDVI_2025_summer_30m.tif`, `Albedo_2025_summer_10m.tif`, and `data/csv_info/composite_indices_2025_summary.csv`.

#### View 4: Day And Night

This view uses the coarser MODIS 1 km product to describe the 2025 day-night surface temperature range. It is designed for area-wide interpretation, not street- or building-scale inspection.

**Day-night map**

- Calculates the difference between daytime and nighttime MODIS LST for each 1 km cell.
- Formula:  
  $$\Delta L(x,y) = L_{\mathrm{day}}(x,y) - L_{\mathrm{night}}(x,y)$$
- High values indicate a stronger day-night swing. Low values can indicate surfaces that retain heat, but they can also indicate areas that heat less during the day and therefore have less heat to lose at night.

**Scatter relationships**

- Compare day-night delta with either albedo or NDVI at the same 1 km cells.
- Formula:  
  $$r = \frac{\sum_i (X_i - \bar{X})(\Delta L_i - \overline{\Delta L})}{\sqrt{\sum_i (X_i - \bar{X})^2}\sqrt{\sum_i (\Delta L_i - \overline{\Delta L})^2}}$$
- The app computes relationship summaries and links each chart point to its geographic map cell.

Main data: `data/webapp_rasters/DeltaLST_2025_summer_1km.tif`, `data/csv_info/albedo_deltalst_2025_1km_pairs.csv`, `data/csv_info/albedo_ndvi_delta_2025_1km_pairs.csv`, and `data/csv_info/albedo_deltalst_2025_1km_stats.csv`.

#### View 5: Zoom Into Districts

This view aggregates 2025 indicators to two planning scales: six administrative districts and ninety statistical areas. It converts pixel-level rasters into comparable area summaries.

**Zonal mean metrics**

- Calculate the average value of a selected metric inside a district or statistical area.
- Formula:  
  $$\bar{M}_Z = \frac{1}{|Z|} \sum_{(x,y) \in Z} M(x,y)$$
- The value is a polygon-level summary, so it smooths pixel-level variability. It is useful for comparison between areas, not for locating individual hot surfaces inside the polygon.

**Critical-area share**

- Calculates the percentage of the polygon where the selected hotspot mask is active.
- Formula:  
  $$\mathrm{HP}_Z = \frac{\left|\{(x,y) \in Z : H(x,y) = 1\}\right|}{|Z|} \times 100\%$$
- High values mean the critical condition is spatially widespread in the area; low values can still hide localized hotspots.

Main data: `data/webapp_vectors/districts_enriched_2025.geojson`, `src/data/statisticalAreas.js`, and `data/webapp_vectors/bologna_boundary_outline.geojson`.

### Data Inventory

The data directory is part of the delivered application because the app is served as a static site.

| Path | Contents |
| --- | --- |
| `webapp/data/gee_lst/` | Annual Landsat LST GeoTIFFs for 2013-2025, including median, mean, and valid-observation-count rasters. |
| `webapp/data/webapp_rasters/` | Public map layers, including LST 2025, NDVI, Albedo, UHEI, HVI, HRI, climatology, anomaly, persistence, and day-night delta. |
| `webapp/data/hotspots/` | Annual structural and temporal hotspot masks plus persistence and chronic/anomalous combinations. |
| `webapp/data/webapp_vectors/` | Bologna boundary and enriched district polygons. |
| `webapp/data/csv_info/` | Yearly statistics, hotspot summaries, composite-index summaries, and scatter-pair CSV files. |
| `webapp/data/csv_data_download/` | Landsat scene metadata for user-facing documentation or download. |
| `webapp/data/bologna_shadow_means/` | GeoJSON/TopoJSON support data for shadow summaries. |

Two source files also act as data registries for the frontend: `webapp/src/data/layers.js` defines layer metadata and raster URLs, while `webapp/src/data/statisticalAreas.js` stores the 90 statistical-area metrics used in View 5.

### Data Pipeline

The notebook `code/00_data_pipeline.ipynb` is the source workflow for rebuilding the data products. It:

1. Generates Google Earth Engine scripts for Landsat LST, Sentinel-2 NDVI, the legacy Landsat albedo workflow, MODIS day-night DeltaLST, and Landsat metadata exports.
2. Checks that downloaded raw files are present locally.
3. Splits Landsat multi-band stacks into yearly rasters.
4. Builds temporal baseline, anomalies, z-scores, hotspot classes, persistence layers, composite indices, and webapp-ready rasters.
5. Prepares vector boundaries and polygon statistics.
6. Writes final inventories and validation tables for human review.

For the current View 3 products, `webapp/scripts/build_albedo_products.py` consumes the supplied Sentinel-2 10 m albedo, writes the native 10 m standalone layer, aggregates albedo by area to the 30 m Landsat grid, and recomputes HRI, UHEI, and their summary tables without changing HVI.

The notebook does not run Earth Engine exports directly. Export scripts must be copied into the Earth Engine Code Editor, tasks must be started there, and the resulting files must be downloaded before the local pipeline steps can run.

To run the notebook locally, use a Python/Jupyter environment with the packages imported by the notebook, including `numpy`, `pandas`, `matplotlib`, `rasterio`, `geopandas`, `requests`, `rasterstats`, and IPython/Jupyter. Google Earth Engine access is required only when regenerating raw satellite exports.

### Localization And URL State

- Default language is Italian.
- Runtime language state is stored in `localStorage` under `talea:language`.
- English copy is defined as overrides over Italian base data in `webapp/src/i18n/localizedData.js`.
- `useUrlSync` mirrors the active view, layer, year, thresholds, map position, palette, values, comparison, and selected area into the URL.
- `webapp/src/lib/appPaths.js` encodes the share state into a compact hash and preserves legacy hash decoding.

### Limitations

The platform describes the **observed surface**, not air temperature, perceived comfort, or social exposure. LST can be several degrees higher than air temperature, especially over dark or low-albedo surfaces.

Satellite observation gaps are kept as no-data cells rather than interpolated. The standalone Sentinel-2 albedo layer has 10 m cells; Landsat thermal layers and every index that includes LST remain at 30 m, while the MODIS day-night layer is 1 km and should be used only for broader spatial interpretation. NDVI, albedo, UHEI, HVI, HRI, and day-night delta are fixed to the 2025 summer baseline.

The hotspot thresholds are analytical conventions: top 5% for structural heat and temporal z-score `>= 1.0` for temporal anomaly. The app does not include population density, vulnerability indices, building age, health outcomes, or social overlays, so policy interpretation should combine these maps with local demographic and environmental datasets.

Orthophoto basemaps use the closest available Bologna orthophoto year among 2017, 2018, and 2020-2025. Buildings, roofs, and vegetation can therefore reflect a nearby year rather than the exact summer being analysed.

## Italiano

### Indice

- [Panoramica](#panoramica)
- [Struttura Del Repository](#struttura-del-repository)
- [Dati E Metodi](#dati-e-metodi)
- [Indicatori Principali](#indicatori-principali)
- [Viste Applicative](#viste-applicative)
- [Inventario Dei Dati](#inventario-dei-dati)
- [Pipeline Dati](#pipeline-dati)
- [Localizzazione E Stato URL](#localizzazione-e-stato-url)
- [Limiti](#limiti)
- [Deploy](#deploy)
- [Licenza](#licenza)

### Panoramica

L'applicazione trasforma un archivio Landsat 8/9 2013-2025 e un prodotto MODIS giorno-notte 2025 in mappe, sintesi e confronti territoriali leggibili da cittadini e tecnici. Il focus è la **temperatura di superficie**: la temperatura di tetti, strade, vegetazione, piazzali e altre superfici osservate dall'alto.

L'obiettivo è superare la lettura di una singola immagine termica. La piattaforma mostra dove Bologna è calda in termini assoluti, dove il caldo è persistente negli anni, dove il 2025 si discosta dal comportamento storico locale e quali fattori fisici aiutano a spiegare il pattern osservato.

L'interfaccia pubblica è organizzata come una narrazione in cinque passaggi. Ogni passaggio combina una mappa con controlli mirati, strumenti di ispezione e sintesi di supporto, così che lo stesso dataset possa essere letto a scala di pixel, quartiere e area statistica.

### Struttura Del Repository

| Percorso | Scopo |
| --- | --- |
| `webapp/` | Applicazione React e Vite. |
| `webapp/src/components/views/` | Le cinque viste narrative dell'applicazione. |
| `webapp/src/components/map/` | Mappe MapLibre, schede raster, legende, tooltip e UI di ispezione. |
| `webapp/src/components/panels/` | Tabelle, scatter plot, schede dettaglio e ricerca area. |
| `webapp/src/data/` | Metadati layer, testi delle viste e metriche delle aree statistiche. |
| `webapp/src/i18n/` | Helper di localizzazione e testi in italiano e inglese. |
| `webapp/src/store/appStore.js` | Stato Zustand condiviso per lingua, vista, layer, anno, soglie, confronto, aggregazione e controlli mappa. |
| `webapp/data/` | Asset geospaziali e tabellari statici serviti dall'app. |
| `webapp/scripts/` | Script di supporto per build e preparazione dati. |
| `webapp/docs/` | Asset del logo Talea importati dall'app. |
| `code/00_data_pipeline.ipynb` | Workflow dati riproducibile per esportazioni Earth Engine ed elaborazioni locali. |
| `LICENSE` | File di licenza del progetto. |

### Dati E Metodi

Tutti i dati analitici sono estratti o calcolati da Google Earth Engine e poi esportati in `webapp/data/` per essere serviti staticamente dal frontend React/Vite. La webapp non ricalcola l'intera pipeline geospaziale: visualizza raster e vettori esportati, con trasformazioni leggere nel browser quando servono alla visualizzazione.

I layer termici derivati da Landsat usano compositi estivi a 30 m per il periodo 2013-2025. Questi alimentano mappe annuali di LST, climatologia, anomalie, z-score, hotspot, persistenza e la componente termica degli indici sintetici. Il layer autonomo dell'albedo 2025 deriva da Sentinel-2 a 10 m; HRI e UHEI restano a 30 m perché includono la temperatura Landsat, con l'albedo mediato per area dalla griglia a 10 m a quella termica. Il layer derivato da MODIS usa un prodotto giorno-notte 2025 a 1 km per descrivere l'escursione termica superficiale tra osservazioni diurne e notturne.

La finestra stagionale principale va dal 1 giugno al 31 agosto. Le osservazioni satellitari nuvolose o non utilizzabili sono escluse.

### Indicatori Principali

| Indicatore | Cosa descrive | Risoluzione / ambito | Sorgente principale |
| --- | --- | --- | --- |
| LST | Temperatura mediana estiva di superficie. | Landsat 30 m, 2013-2025. | `data/gee_lst/Bologna_LST_{year}_summer_median_30m.tif` |
| Z-score spaziale | Scostamento dalla media urbana di Bologna nello stesso anno. | Landsat 30 m, ogni anno. | Calcolato dai raster LST annuali. |
| Climatologia | Media estiva LST 2013-2025. | Landsat 30 m. | `data/webapp_rasters/climatology_mean_2013_2025_30m.tif` |
| Anomalia 2025 | LST 2025 confrontata con il riferimento storico dello stesso pixel. | Landsat 30 m. | `data/webapp_rasters/anomaly_2025_summer_30m.tif` |
| Persistenza temporale | Numero di estati in cui un pixel è anomalo rispetto alla propria storia. | Landsat 30 m, conteggio osservato 0-5. | `data/webapp_rasters/hotspot_temporal_persistence_2013_2025.tif` |
| Persistenza strutturale | Numero di estati in cui un pixel è nel top 5% LST della città. | Landsat 30 m, conteggio 0-13. | `data/webapp_rasters/hotspot_structural_persistence_2013_2025.tif` |
| UHEI / HVI / HRI | Indici sintetici che collegano caldo, vegetazione e albedo. HRI e UHEI usano il nuovo albedo mediato sulla griglia termica. | 30 m, 2025. | `data/webapp_rasters/UHEI_2025_summer_30m.tif`, `HVI`, `HRI` |
| NDVI | Presenza e densità della vegetazione. | Layer 2025 derivato da Sentinel-2 sulla griglia webapp a 30 m. | `data/webapp_rasters/NDVI_2025_summer_30m.tif` |
| Albedo | Riflettenza della superficie. A monte sono state interpolate a 10 m soltanto le bande native a 20 m. | Sentinel-2 10 m, 2025. | `data/webapp_rasters/Albedo_2025_summer_10m.tif` |
| Delta giorno-notte | Escursione della temperatura di superficie tra giorno e notte. | MODIS 1 km, 2025. | `data/webapp_rasters/DeltaLST_2025_summer_1km.tif` |
| Metriche zonali | Valori medi per quartiere o area statistica. | 6 quartieri, 90 aree statistiche. | `data/webapp_vectors/districts_enriched_2025.geojson`, `src/data/statisticalAreas.js` |

### Viste Applicative

| Vista | Domanda | Contenuto principale |
| --- | --- | --- |
| 1. Dove fa caldo | Dove la superficie è più calda nell'anno selezionato? | LST annuale, z-score spaziale, slider anno, confronto LST, overlay hotspot temporale. |
| 2. Cosa è normale, cosa è cambiato | Cosa è abituale, persistente o anomalo nel periodo 2013-2025? | Climatologia, anomalia 2025, persistenza temporale e strutturale, classi cronico/anomalo. |
| 3. Perché fa caldo qui | Quali condizioni fisiche aiutano a spiegare la concentrazione del caldo? | UHEI, HVI, HRI, NDVI e Albedo sulla base 2025. |
| 4. Giorno e notte | Dove la superficie si raffredda di più o di meno tra giorno e notte? | Mappa MODIS del delta giorno-notte e relazioni scatter con albedo o NDVI. |
| 5. Zoom sui quartieri | Come si confrontano quartieri e aree statistiche? | Aggregazione per quartieri/aree statistiche, tabella ordinabile, ricerca, ispezione mappa, scheda dettaglio. |

#### Vista 1: Dove Fa Caldo

Questa vista legge l'archivio annuale della temperatura di superficie. La sua logica è: prima mostrare la temperatura assoluta dell'estate selezionata, poi offrire una vista standardizzata delle differenze interne alla città, poi evidenziare opzionalmente i luoghi anomali rispetto alla propria storia.

**Layer LST annuale**

- Calcola la temperatura mediana estiva di superficie dell'anno selezionato per ogni pixel.
- Formula:  
  $$L(x,y,t)$$
- Valori alti identificano le superfici più calde in termini assoluti nell'anno `t`. Il modale di confronto mantiene la stessa scala LST tra due anni, così il confronto visivo resta coerente.

**Layer z-score spaziale**

- Calcola quanto ogni pixel è sopra o sotto la media di Bologna nello stesso anno.
- Formula:  
  $$z_s(x,y,t) = \frac{L(x,y,t) - \mu_C(t)}{\sigma_C(t)}$$
- `0` indica valori vicini alla media urbana dell'anno, valori positivi indicano superfici più calde della media urbana, valori negativi superfici più fresche. Non è una temperatura in gradi.

**Overlay di anomalia temporale**

- Calcola se un pixel è insolitamente caldo rispetto al proprio comportamento nel periodo 2013-2025.
- Formula:  
  $$z_t(x,y,t) = \frac{L(x,y,t) - \mu_P(x,y)}{\sigma_P(x,y)}$$
  $$H_t(x,y,t) = \mathbb{1}\left[z_t(x,y,t) \geq 1.0\right]$$
- L'overlay non segnala semplicemente le superfici più calde. Segnala i luoghi in cui l'anno selezionato è alto rispetto al comportamento normale dello stesso pixel.

Dati principali: `data/gee_lst/Bologna_LST_{year}_summer_median_30m.tif`, `data/hotspots/hotspot_temporal_{year}_zgt1p0.tif` e `data/csv_info/LST_yearly_input_summary_median_30m.csv`.

#### Vista 2: Cosa È Normale, Cosa È Cambiato

Questa vista passa dalla lettura di un singolo anno alla storia completa 2013-2025. La sequenza è: prima il riferimento di base, poi lo scostamento del 2025, poi la ricorrenza, infine la combinazione interpretativa.

**Climatologia**

- Calcola la media estiva LST di lungo periodo per ciascun pixel.
- Formula:  
  $$\mu_P(x,y) = \frac{1}{N} \sum_{t=2013}^{2025} L(x,y,t), \qquad N = 13$$
- Un valore caldo indica una superficie abitualmente calda, non necessariamente anomala.

**Anomalia 2025**

- Calcola lo scostamento del 2025 dalla climatologia dello stesso pixel.
- Formula:  
  $$A_{2025}(x,y) = L(x,y,2025) - \mu_P(x,y)$$
- Valori positivi indicano un 2025 più caldo del comportamento normale di quel pixel; valori negativi indicano un 2025 più fresco.

**Persistenza strutturale**

- Conta in quanti anni un pixel è rientrato nel 5% più caldo di Bologna per quell'anno.
- Formula:  
  $$H_s(x,y,t) = \mathbb{1}\left[L(x,y,t) \geq P_{95}(L(\cdot,\cdot,t))\right]$$
  $$P_s(x,y) = \sum_{t=2013}^{2025} H_s(x,y,t)$$
- Valori alti identificano luoghi di caldo cronico, cioè superfici che ricorrono spesso tra le più calde della città.

**Persistenza temporale**

- Conta in quanti anni un pixel è stato insolitamente caldo rispetto alla propria storia.
- Formula:  
  $$H_t(x,y,t) = \mathbb{1}\left[z_t(x,y,t) \geq 1.0\right]$$
  $$P_t(x,y) = \sum_{t=2013}^{2025} H_t(x,y,t)$$
- Un luogo può essere strutturalmente caldo ma non temporalmente anomalo se è caldo in modo stabile e ricorrente.

Dati principali: `data/webapp_rasters/climatology_mean_2013_2025_30m.tif`, `data/webapp_rasters/anomaly_2025_summer_30m.tif`, raster di persistenza, raster di combinazione hotspot e sintesi CSV in `data/csv_info/`.

#### Vista 3: Perché Fa Caldo Qui

Questa vista spiega il contesto fisico 2025 che aiuta a interpretare l'accumulo di calore. Tutti i layer usano la stessa base estiva 2025, quindi temperatura di superficie, vegetazione e riflettenza possono essere confrontate senza mescolare anni diversi.

La mappa autonoma dell'albedo mantiene la griglia nativa di output a 10 m. HRI e UHEI restano sulla griglia termica Landsat a 30 m: prima di calcolare questi indici, le celle dell'albedo a 10 m vengono aggregate con una media areale. In questo modo la componente termica non viene presentata come se contenesse informazione a 10 m.

**Normalizzazione**

- Riscala ogni layer di input dentro il confine di Bologna su un intervallo comune 0-1 prima di combinarli.
- Formula:  
  $$X_{\mathrm{norm}}(x,y) = \frac{X(x,y) - \min_{\Omega} X}{\max_{\Omega} X - \min_{\Omega} X}$$
- La normalizzazione rende LST, NDVI e Albedo confrontabili come input degli indici. Non trasforma questi valori in unità fisiche.

**UHEI: esposizione combinata**

- Combina temperatura alta, poca vegetazione e bassa riflettenza.
- Formula:  
  $$\mathrm{UHEI}(x,y) = L_{\mathrm{norm}}(x,y) + \left(1 - \mathrm{NDVI}_{\mathrm{norm}}(x,y)\right) + \left(1 - \alpha_{\mathrm{norm}}(x,y)\right)$$
- Valori alti indicano luoghi in cui le tre condizioni fisiche si rinforzano. UHEI è un indice, non una temperatura.

**HVI e HRI**

- Formula:  
  $$\mathrm{HVI}(x,y) = L_{\mathrm{norm}}(x,y) - \mathrm{NDVI}_{\mathrm{norm}}(x,y)$$
  $$\mathrm{HRI}(x,y) = L_{\mathrm{norm}}(x,y) - \alpha_{\mathrm{norm}}(x,y)$$
- HVI evidenzia dove caldo elevato e poca vegetazione coincidono; HRI evidenzia dove caldo elevato e bassa riflettenza coincidono.
- NDVI e Albedo restano disponibili come layer autonomi perché gli indici compositi devono essere interpretati attraverso le loro componenti.

Dati principali: `data/webapp_rasters/UHEI_2025_summer_30m.tif`, `HVI_2025_summer_30m.tif`, `HRI_2025_summer_30m.tif`, `NDVI_2025_summer_30m.tif`, `Albedo_2025_summer_10m.tif` e `data/csv_info/composite_indices_2025_summary.csv`.

#### Vista 4: Giorno E Notte

Questa vista usa il prodotto MODIS a 1 km, più grossolano, per descrivere l'escursione giorno-notte della temperatura di superficie nel 2025. È pensata per una lettura su area vasta, non per ispezioni a scala di strada o edificio.

**Mappa giorno-notte**

- Calcola la differenza tra LST MODIS diurna e notturna per ogni cella da 1 km.
- Formula:  
  $$\Delta L(x,y) = L_{\mathrm{day}}(x,y) - L_{\mathrm{night}}(x,y)$$
- Valori alti indicano una maggiore escursione tra giorno e notte. Valori bassi possono indicare superfici che trattengono calore, ma anche aree che si scaldano meno durante il giorno e quindi hanno meno calore da perdere di notte.

**Relazioni scatter**

- Confrontano il delta giorno-notte con albedo oppure NDVI nelle stesse celle da 1 km.
- Formula:  
  $$r = \frac{\sum_i (X_i - \bar{X})(\Delta L_i - \overline{\Delta L})}{\sqrt{\sum_i (X_i - \bar{X})^2}\sqrt{\sum_i (\Delta L_i - \overline{\Delta L})^2}}$$
- L'app calcola sintesi della relazione e collega ogni punto del grafico alla sua cella geografica sulla mappa.

Dati principali: `data/webapp_rasters/DeltaLST_2025_summer_1km.tif`, `data/csv_info/albedo_deltalst_2025_1km_pairs.csv`, `data/csv_info/albedo_ndvi_delta_2025_1km_pairs.csv` e `data/csv_info/albedo_deltalst_2025_1km_stats.csv`.

#### Vista 5: Zoom Sui Quartieri

Questa vista aggrega gli indicatori 2025 su due scale di pianificazione: i sei quartieri amministrativi e le novanta aree statistiche. Converte i raster a livello di pixel in sintesi territoriali confrontabili.

**Metriche di media zonale**

- Calcolano il valore medio di una metrica selezionata dentro un quartiere o un'area statistica.
- Formula:  
  $$\bar{M}_Z = \frac{1}{|Z|} \sum_{(x,y) \in Z} M(x,y)$$
- Il valore è una sintesi di poligono, quindi attenua la variabilità interna dei pixel. Serve per confrontare aree tra loro, non per localizzare singole superfici calde dentro il poligono.

**Quota area critica**

- Calcola la percentuale del poligono in cui la maschera hotspot selezionata è attiva.
- Formula:  
  $$\mathrm{HP}_Z = \frac{\left|\{(x,y) \in Z : H(x,y) = 1\}\right|}{|Z|} \times 100\%$$
- Valori alti indicano che la condizione critica è diffusa nell'area; valori bassi possono comunque nascondere hotspot localizzati.

Dati principali: `data/webapp_vectors/districts_enriched_2025.geojson`, `src/data/statisticalAreas.js` e `data/webapp_vectors/bologna_boundary_outline.geojson`.

### Inventario Dei Dati

La cartella dati fa parte dell'applicazione pubblicata perché l'app viene servita come sito statico.

| Percorso | Contenuto |
| --- | --- |
| `webapp/data/gee_lst/` | GeoTIFF annuali Landsat LST per il periodo 2013-2025, inclusi raster di mediana, media e conteggio osservazioni valide. |
| `webapp/data/webapp_rasters/` | Layer pubblici, inclusi LST 2025, NDVI, Albedo, UHEI, HVI, HRI, climatologia, anomalia, persistenza e delta giorno-notte. |
| `webapp/data/hotspots/` | Maschere annuali di hotspot strutturale e temporale, più combinazioni di persistenza e cronico/anomalo. |
| `webapp/data/webapp_vectors/` | Confine di Bologna e poligoni dei quartieri arricchiti. |
| `webapp/data/csv_info/` | Statistiche annuali, sintesi hotspot, sintesi degli indici compositi e CSV per gli scatter plot. |
| `webapp/data/csv_data_download/` | Metadati Landsat per documentazione o download lato utente. |
| `webapp/data/bologna_shadow_means/` | Dati GeoJSON/TopoJSON di supporto per le sintesi sulle ombre. |

Due file sorgente funzionano anche come registri dati per il frontend: `webapp/src/data/layers.js` definisce metadati dei layer e URL dei raster, mentre `webapp/src/data/statisticalAreas.js` contiene le metriche delle 90 aree statistiche usate nella Vista 5.

### Pipeline Dati

Il notebook `code/00_data_pipeline.ipynb` è il workflow sorgente per rigenerare i prodotti dati. Il notebook:

1. Genera script Google Earth Engine per esportare Landsat LST, Sentinel-2 NDVI, il workflow legacy dell'albedo Landsat, MODIS DeltaLST giorno-notte e metadati Landsat.
2. Controlla che i file grezzi scaricati siano presenti localmente.
3. Divide gli stack multi-banda Landsat in raster annuali.
4. Costruisce baseline temporale, anomalie, z-score, classi hotspot, persistenze, indici compositi e raster pronti per la webapp.
5. Prepara confini vettoriali e statistiche poligonali.
6. Scrive inventari finali e tabelle di validazione per revisione umana.

Per i prodotti correnti della Vista 3, `webapp/scripts/build_albedo_products.py` usa l'albedo Sentinel-2 a 10 m fornito, scrive il layer autonomo nativo a 10 m, aggrega l'albedo per area sulla griglia Landsat a 30 m e ricalcola HRI, UHEI e le relative tabelle di sintesi senza modificare HVI.

Il notebook non esegue direttamente le esportazioni Earth Engine. Gli script di esportazione devono essere copiati nell'Earth Engine Code Editor, i task devono essere avviati da lì e i file prodotti devono essere scaricati prima di eseguire le fasi locali della pipeline.

Per eseguire il notebook localmente serve un ambiente Python/Jupyter con i pacchetti importati dal notebook, tra cui `numpy`, `pandas`, `matplotlib`, `rasterio`, `geopandas`, `requests`, `rasterstats` e IPython/Jupyter. L'accesso a Google Earth Engine serve solo quando si rigenerano le esportazioni satellitari grezze.

### Localizzazione E Stato URL

- La lingua predefinita è l'italiano.
- Lo stato della lingua è salvato a runtime in `localStorage` con chiave `talea:language`.
- I testi inglesi sono definiti come override della base italiana in `webapp/src/i18n/localizedData.js`.
- `useUrlSync` copia nell'URL vista, layer, anno, soglie, posizione mappa, palette, valori, confronto e area selezionata.
- `webapp/src/lib/appPaths.js` codifica lo stato condivisibile in un hash compatto e mantiene la decodifica degli hash legacy.

### Limiti

La piattaforma descrive la **superficie osservata**, non la temperatura dell'aria, il comfort percepito o l'esposizione sociale. La LST può essere diversi gradi più alta della temperatura dell'aria, soprattutto su superfici scure o a basso albedo.

I buchi di osservazione satellitare sono mantenuti come celle senza dato e non interpolati. Il layer autonomo dell'albedo Sentinel-2 ha celle di 10 m; i layer termici Landsat e tutti gli indici che includono la LST restano a 30 m, mentre il layer MODIS giorno-notte è a 1 km e va usato solo per interpretazioni spaziali più ampie. NDVI, albedo, UHEI, HVI, HRI e delta giorno-notte sono fissati alla sola base estiva 2025.

Le soglie hotspot sono convenzioni analitiche: top 5% per il caldo strutturale e z-score temporale `>= 1.0` per l'anomalia temporale. L'app non include densità di popolazione, indici di vulnerabilità, età degli edifici, esiti sanitari o overlay sociali; l'uso per policy deve quindi combinare queste mappe con dataset demografici e ambientali locali.

Gli sfondi ortofoto usano l'anno più vicino disponibile tra le ortofoto di Bologna del 2017, 2018 e 2020-2025. Per questo edifici, tetti e vegetazione possono riflettere un anno vicino, ma non sempre esattamente l'estate analizzata.
