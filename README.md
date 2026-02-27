# Nike Sports Moment Tracker

An interactive 3D globe application built with the **ArcGIS Maps SDK for JavaScript 4.29** that visualises **200 global Nike-sponsored sport events** across 2026. Designed for Nike's Supply Chain & Resilience team to explore event opportunities, athlete presence, and strategic readiness at a glance.

**Live app:** [garridolecca.github.io/nike-sports-moment-tracker](https://garridolecca.github.io/nike-sports-moment-tracker)

---

## Features

- **3D Globe** — Full-screen SceneView with the Streets (Dark) 3D basemap, extruded buildings, and world elevation
- **200 Global Events** — Tennis, basketball, soccer, athletics, skateboarding, gymnastics, breaking, swimming, golf, boxing, fencing, cycling, triathlon, and Paralympic events spanning March–August 2026
- **Sport-Colored 3D Markers** — Each event is rendered as a `point-3d` cone symbol in its sport's brand color, emerging from the ground at street level
- **Street-Level Fly-In** — Clicking any event flies the camera to a city-block view (scale 1:3 000, 60° tilt) centered precisely in the visible viewport
- **Nike Athlete Overlay** — 44 designated Nike athletes are matched to events and displayed in the detail panel
- **Strategic Opportunity Scoring** — Each event is automatically scored across 5 dimensions and the top 3 factors are surfaced with rationale and animated bar charts:
  - Media Exposure (PHQ event rank)
  - Athlete Presence (designated Nike athletes)
  - Fan Engagement (estimated attendance)
  - Supply Chain Readiness (days until event)
  - Strategic Market Fit (sport × Nike priority index)
- **Right-Side Detail Panel** — Slides in from the right with event metadata, athletes, and opportunity scores; never covers the globe
- **Scale-Dependent Labels** — Event name labels are hidden at global altitude and appear automatically when zoomed below 1 200 km
- **Live Event Ticker** — Draggable / touch-scrollable bottom bar showing all 200 events sorted by date; active card auto-centers
- **Globe Reset** — One-click return to the full-globe overview from any zoom level
- **Auto-Advance Mode** — Optional timed fly-through of all events (disabled by default)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Map engine | ArcGIS Maps SDK for JavaScript 4.29 |
| Basemap | `streets-dark-3d` (Esri hosted 3D basemap) |
| 3D symbology | `point-3d` with `icon` + `object` (cone) symbol layers |
| Event data | PredictHQ export — 200 events, custom Python generation scripts |
| Athlete data | Nike athlete CSV — 44 athletes with sport & nationality |
| Hosting | GitHub Pages |
| Dependencies | None (zero npm, zero bundler — pure HTML/CSS/JS) |

---

## Project Structure

```
sports-tracker-app/
├── index.html          # App shell — ArcGIS SDK CDN, layout, controls
├── css/
│   └── styles.css      # Dark theme, ticker cards, right panel, factor bars
└── js/
    ├── data.js         # Auto-generated — 200 events + 44 athletes as JS constants
    └── app.js          # ArcGIS SceneView logic, 3D symbols, scoring engine
```

---

## Getting Started

### Run locally

No build step required. Just serve the folder with any static server:

**VS Code Live Server**
1. Open the `sports-tracker-app` folder in VS Code
2. Right-click `index.html` → **Open with Live Server**

**Python**
```bash
cd sports-tracker-app
python -m http.server 8000
# open http://localhost:8000
```

**Node / npx**
```bash
npx serve sports-tracker-app
```

### ArcGIS API Key (required for the hosted basemap)

The `streets-dark-3d` basemap uses Esri-hosted services. For production or public hosting, add a free developer API key:

1. Sign up free at [developers.arcgis.com](https://developers.arcgis.com)
2. Create an API key with **Basemaps** access
3. Open `js/app.js` and edit line 108:

```js
// Before
// esriConfig.apiKey = CFG.API_KEY;

// After
esriConfig.apiKey = 'YOUR_API_KEY_HERE';
```

4. Save and redeploy — the free tier covers 2 million tile requests/month

---

## How to Use

| Action | Result |
|---|---|
| Click an event pin on the globe | Flies to street level, opens detail panel |
| Click a card in the bottom ticker | Same as above |
| Drag the ticker | Scroll through all 200 events |
| Click **Globe** | Returns to full-globe overview |
| Click **Auto** | Toggles timed auto-advance through all events |
| Press **Escape** | Closes the detail panel |
| Zoom / pan / orbit | Free 3D navigation |

---

## Data Sources

- **Events** — Generated from a PredictHQ Los Angeles County export, expanded globally to 200 sport events across 14 sport categories using custom Python scripts
- **Athletes** — Nike athlete roster CSV with sport, nationality, and image URL fields
- **Basemap & 3D Buildings** — Esri Streets Dark 3D (OpenStreetMap-derived, hosted on ArcGIS Online)
- **Event scoring** — Algorithmic, based on PHQ rank, attendance, athlete count, days-to-event, and sport category priority index

---

## Screenshots

> Click any event marker to fly to street level and see the full detail panel.

| Global View | Street-Level Detail |
|---|---|
| 200 sport-colored cones on a dark 3D globe | 3D buildings, cone marker centered in view, right-side panel with scores |

---

## License

Internal use — Nike Supply Chain & Resilience presentation. Not for redistribution.
