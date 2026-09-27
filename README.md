# Borderline

A web geography game: draw Western Europe's missing country borders from memory, then compare them with real geography.

## Run

```sh
npm start
```

Open http://localhost:8000. Python 3 is required for the development server. No package installation or build step is needed. You can also serve this directory with any static web server; opening `index.html` directly will not work because the map is fetched as JSON.

## Play

Drag on the map using a mouse, pen, or touch. Release to start another border. Undo removes the last stroke (also Ctrl/Cmd+Z); Clear removes all strokes. Check your borders reveals the actual borders and scores your attempt. Try again starts a blank map. The remaining-border counter tracks the 19 unique country pairs. A border is recognised when at least 60% of its total length is within approximately 75 km of your drawing. This is an approximate recognition rule, separate from the stricter 25 km tolerance used for scoring. Nearby short borders can also be recognised by this proximity rule. After submission, the counter reads “borders not recognised”. The count updates after each stroke and after Undo, Clear, or Try again. Multiple strokes can cover one border, one stroke can cover several, and retracing never counts a border twice. All disconnected segments of a country pair are measured together, weighted by length. The final score still measures full geographic coverage and drawing accuracy.

The 13-country region includes Portugal, Spain, France, Belgium, the Netherlands, Luxembourg, Germany, Switzerland, Austria, Italy, Denmark, the United Kingdom, and Ireland. Only shared land borders between these countries count. The region is an intentionally broad game definition of Western Europe.

## Scoring

- Coverage: the length-weighted fraction of real borders within approximately 25 km of a drawn line.
- Accuracy: the length-weighted fraction of drawn lines within approximately 25 km of a real border.
- Final score: the harmonic mean of coverage and accuracy, scaled to 100.

Lengths are sampled at intervals of at most 4 projected km. Distances use an equirectangular projection centered at 48° N, so the tolerance is approximate. Additional incorrect lines reduce accuracy. Repeated strokes do not increase coverage. This is a forgiving prototype score, not a geodetic measurement.

## Check

```sh
npm test
```

Requires Node.js 18 or later. Tests cover perfect, empty, distant, incomplete, excessive, and repeated drawings, plus real border extraction.

## Data and limitations

Map data is bundled in `data/countries-50m.json` from [world-atlas 2](https://github.com/topojson/world-atlas), derived from [Natural Earth](https://www.naturalearthdata.com/) public-domain 1:50m geography. Country borders come from shared TopoJSON arcs. Tiny states and some small geographic details are absent at this resolution. No map API or API key is required. Google Fonts is optional; local font fallbacks work offline.

Zoom from 100% to 800% with the +/− controls or the mouse wheel. Wheel zoom follows the cursor. Toggle Pan to drag the map, or use the middle mouse button. On touchscreens, use two fingers to pinch and pan. Fit restores the full map. Drawings stay anchored to geographic coordinates at every zoom level. The canvas needs pointer input; buttons support keyboard use, but border drawing is not yet keyboard accessible. Progress is held in memory and resets on refresh.
