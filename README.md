# Wayfarer

A bilingual travel guide portfolio built with HTML, CSS, JavaScript, and Vite.

Explore destinations, filter places by interest, save favorites, and plan a trip
with an interactive Leaflet and OpenStreetMap map. The interface supports English
and German, light and dark themes, and responsive layouts.

## Run locally

Requires Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:5173>.

## Production build

```sh
npm run build
npm run preview
```

The production files are generated in `dist/`. The preview is served at
<http://127.0.0.1:4173>.

## Checks

```sh
npm run check
npm test
npm run test:a11y
```

The browser checks use a local Google Chrome installation. They default to
`C:/Program Files/Google/Chrome/Application/chrome.exe`; `npm test` also supports
the `CHROME_PATH` environment variable.

## Third-party assets

Photo sources are listed in `public/credits.json`. Font licenses are included in
`public/licenses/fonts/`, and the Leaflet license is included in
`public/vendor/leaflet/leaflet-LICENSE.txt`. The map displays OpenStreetMap
attribution.
