# Borderline

A web geography game: draw missing borders from memory, then compare them with real geography.

[Play](https://cwoodrow.github.io/borderline/) · [Jouer en français](https://cwoodrow.github.io/borderline/?lang=fr)

## Maps

Choose a map from the selector. Each map keeps its current attempt while you switch, until the page is refreshed. Share `?map=africa&lang=fr` (or another map ID) to open a specific map and language.

| Map ID | Scope | Shared borders | Scoring tolerance | Recognition tolerance |
| --- | --- | ---: | ---: | ---: |
| `europe` | 13 Western European countries | 19 | 25 km | 75 km |
| `africa` | Maghreb & neighbours: 8 countries + Western Sahara | 14 | 40 km | 120 km |
| `south-america` | 12 countries + French Guiana | 25 | 50 km | 150 km |
| `usa` | Northeastern USA: 9 states | 13 | 12 km | 36 km |
| `france` | 13 metropolitan French regions | 23 | 10 km | 30 km |

Country/state codes and regional abbreviations provide hints. Only shared boundaries between selected areas count; point-only contacts and coastlines do not. Islands without shared borders need no drawing. The US map includes New England, New York, New Jersey and Pennsylvania. The Maghreb map includes Morocco, Algeria, Tunisia, Libya, Mauritania, Mali, Niger, Egypt and Western Sahara. Other US states and African countries, and overseas French regions, are outside these scopes. The `usa` and `africa` link IDs are retained for existing links.

## Middle-earth

[Play the Middle-earth fan map](https://cwoodrow.github.io/borderline/?map=middle-earth). It has 11 realms and regions and 17 shared game boundaries. This original schematic uses invented boundaries, arbitrary map units, and terrain hints; it is not a canonical political map. English and French are supported.

## Languages

Use the header menu to switch between English and French without losing your drawing. The choice is saved in this browser. URL language takes priority over the saved choice, then the browser’s ordered language preferences. Regional variants such as `fr-CA` and `en-GB` are supported; English is the fallback.

## Run

```sh
npm start
```

Open http://localhost:8000. Python 3 is required for the development server. No package installation or build step is needed. Any static web server works; opening `index.html` directly does not, because the map is fetched as JSON.

## Play

Drag using a mouse, pen, or touch. Release to finish a stroke. Undo removes the last stroke (also Ctrl/Cmd+Z); Clear removes all strokes. Check your borders reveals the actual borders and scores your attempt. Try again starts a blank attempt for the current map.

Zoom from 100% to 800% with +/− or the mouse wheel. Wheel zoom follows the cursor. Toggle Pan to move, or use the middle mouse button. On touchscreens, pinch and pan with two fingers. Fit restores the full map. Drawings stay anchored to geographic coordinates at every zoom level.

## Scoring

- Coverage: the length-weighted fraction of real borders within the map’s scoring tolerance of your drawing.
- Accuracy: the length-weighted fraction of your drawing within the same tolerance of a real border.
- Final score: their harmonic mean, scaled to 100.

The remaining-border counter measures unique area pairs. It recognises a border when at least 60% of its length is within the larger recognition tolerance. Multiple strokes can cover one border, and one stroke can cover several. Retracing does not increase coverage. All disconnected segments of each pair are measured together, weighted by length. Undo and Clear recalculate the count. After submission it reads “borders not recognised”. Nearby short borders can be recognised by this proximity rule.

Lengths are sampled at intervals of at most 4 projected km. Each map uses an equirectangular projection at its reference latitude, so distances and tolerances are approximate. Larger maps use wider tolerances to remain playable; French regions use smaller tolerances. Scoring is a game heuristic, not a geodetic measurement.

## Check

```sh
npm test
```

Requires Node.js 18 or later. Tests cover scoring, recognition, shared-boundary extraction for every map, language preferences, and zoom coordinates.

## Data and limitations

See [data sources, licences, and scope conventions](data/README.md). Geographic files are bundled locally. Google Fonts is optional; fallback fonts work offline. No map API or API key is required.

The canvas requires pointer input; buttons support keyboard use, but border drawing is not yet keyboard accessible. Attempts are stored only in memory and reset on refresh. Dataset boundaries are simplified and may omit very small features. France's regional geography is sourced from IGN/INSEE 2018; this is a game, not a current administrative reference.

Pushes to `main` deploy automatically to GitHub Pages.
