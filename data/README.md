# Geographic data

All data is bundled locally; players need no API key.

- `countries-50m.json`: [world-atlas 2](https://github.com/topojson/world-atlas), derived from [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) public-domain 1:50m data. Used for Europe, Africa, and South America.
- `us-states.json`: [us-atlas 3](https://github.com/topojson/us-atlas), `states-10m.json`, derived from the US Census Bureau. Coordinates are unprojected longitude/latitude. Package licence: ISC (see `us-atlas-LICENSE`).
- `france-regions.json`: converted from [france-geojson](https://github.com/gregoiredavid/france-geojson/blob/master/regions-version-simplifiee.geojson), IGN Admin Express / INSEE 2018, under the [Etalab Open Licence](https://www.etalab.gouv.fr/licence-ouverte-open-licence/). Conversion preserves the source coordinates, deduplicates shared edges, and renames the property `nom` to `name`. Reproduce with `python3 scripts/prepare-regions.py input.geojson data/france-regions.json`.

Downloaded September 27, 2026. These are simplified game maps, not current authoritative boundary records. The France dataset uses the post-2016 metropolitan regions.

## Game scopes

- Western Europe: 13 selected countries.
- Africa: 54 countries plus Western Sahara as depicted by Natural Earth. Somaliland is grouped with Somalia; their internal seam is excluded. Territorial depiction is a dataset convention, not a statement on sovereignty.
- South America: 12 countries plus French Guiana (label GF); no island dependencies outside that selection.
- USA: 48 contiguous states. Alaska, Hawaii, DC, and overseas territories are excluded. Point-only contacts do not count as shared borders.
- France: 13 metropolitan regions, including Corsica. Overseas regions are excluded. Corsica has no shared land boundary to draw.

## Middle-earth fan map

`middle-earth.json` is an original, hand-authored schematic fan-game layout inspired by Tolkien's place names and broad geography. Its 11 areas and 17 shared boundaries are invented for this game. They are not canonical political borders, a georeferenced map, or a reconstruction of a particular date. Mountains and a river are schematic orientation hints. No published map image is bundled or traced. Tolkien's original maps can be explored at the [Tolkien Estate maps gallery](https://www.tolkienestate.com/painting/maps/).

Coordinates use arbitrary game units; the usual kilometre interpretation does not apply. Rebuild using `python3 scripts/prepare-middle-earth.py`. The Shire is an enclave within the Eriador game area; the other areas are Lindon, Rhovanion, Rhûn, Enedwaith, Rohan, Gondor, Mordor, Khand and Harad. Names and setting originate in Tolkien's fiction; this is an unofficial fan prototype.
