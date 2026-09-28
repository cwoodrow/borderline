# Geographic data

All data is bundled locally; players need no API key.

- `countries-50m.json`: [world-atlas 2](https://github.com/topojson/world-atlas), derived from [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) public-domain 1:50m data. Used for Europe, Africa, and South America.
- `us-states.json`: [us-atlas 3](https://github.com/topojson/us-atlas), `states-10m.json`, derived from the US Census Bureau. Coordinates are unprojected longitude/latitude. Package licence: ISC (see `us-atlas-LICENSE`).
- `france-regions.json`: converted from [france-geojson](https://github.com/gregoiredavid/france-geojson/blob/master/regions-version-simplifiee.geojson), IGN Admin Express / INSEE 2018, under the [Etalab Open Licence](https://www.etalab.gouv.fr/licence-ouverte-open-licence/). Conversion preserves the source coordinates, deduplicates shared edges, and renames the property `nom` to `name`. Reproduce with `python3 scripts/prepare-regions.py input.geojson data/france-regions.json`.

Downloaded September 27, 2026. These are simplified game maps, not current authoritative boundary records. The France dataset uses the post-2016 metropolitan regions.

## Game scopes

- Western Europe: 13 selected countries.
- Maghreb & neighbours (`africa`): Morocco, Algeria, Tunisia, Libya, Mauritania, Mali, Niger, Egypt and Western Sahara as depicted by Natural Earth. Territorial depiction is a dataset convention, not a statement on sovereignty.
- South America: 12 countries plus French Guiana (label GF); no island dependencies outside that selection.
- Northeastern USA (`usa`): Connecticut, Maine, Massachusetts, New Hampshire, New Jersey, New York, Pennsylvania, Rhode Island and Vermont. All other states and territories are excluded. Point-only contacts do not count as shared borders.
- France: 13 metropolitan regions, including Corsica. Overseas regions are excluded. Corsica has no shared land boundary to draw.

## Menu silhouettes

The SVG thumbnails in `assets/maps/` are generated from these same bundled datasets, with no internal borders. Rebuild with `node scripts/prepare-thumbnails.mjs`. The source attribution above also applies to these derived silhouettes.
