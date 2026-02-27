/* =============================================================================
   Nike Sports Moment Tracker  |  app.js
   ArcGIS Maps SDK for JavaScript 4.29
   ========================================================================== */

/* ---------------------------------------------------------------------------
   CONFIG
   ------------------------------------------------------------------------- */
const CFG = {
  AUTO_MS   : 5000,     // ms between auto-advances
  FLY_MS    : 3000,     // camera fly duration
  INIT_LON  : -30,
  INIT_LAT  : 22,
  INIT_Z    : 19500000, // ~19 500 km – full-globe view
  // API_KEY: 'YOUR_ARCGIS_API_KEY',  // uncomment for production
};

const SPORT_COLORS = {
  tennis        : '#4CAF50',
  athletics     : '#FF6B35',
  golf          : '#A07840',
  basketball    : '#FF9800',
  soccer        : '#2196F3',
  swimming      : '#00BCD4',
  skateboarding : '#AB47BC',
  gymnastics    : '#EC407A',
  breaking      : '#FFC107',
  boxing        : '#EF5350',
  fencing       : '#78909C',
  paralympic    : '#26A69A',
  cycling       : '#C6D837',
  triathlon     : '#5C6BC0',
};

/* ---------------------------------------------------------------------------
   STATE
   ------------------------------------------------------------------------- */
let sceneView  = null;
let isAuto     = false;
let autoTimer  = null;
let curIdx     = 0;

// drag-to-scroll
let isDragging = false;
let dragStartX = 0;
let trackTX    = 0;   // current translateX (negative = scrolled right)

/* ---------------------------------------------------------------------------
   PIN ICON  – white circle with a dark map-pin inside
   ------------------------------------------------------------------------- */
const PIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">' +
  '<circle cx="14" cy="14" r="13" fill="white" opacity=".96"' +
  ' stroke="rgba(0,0,0,.3)" stroke-width="1"/>' +
  '<path d="M14 7C11.24 7 9 9.24 9 12c0 4.15 5 9 5 9s5-4.85 5-9' +
  'c0-2.76-2.24-5-5-5zm0 6.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5' +
  ' 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#1a1a1a"/>' +
  '</svg>';

const PIN_URL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(PIN_SVG);

/* ---------------------------------------------------------------------------
   UTILITIES
   ------------------------------------------------------------------------- */
function sportColor(s) {
  const key = (s || '').toLowerCase().split(',')[0].trim();
  return SPORT_COLORS[key] || '#888';
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toDate(s) {
  if (!s || s.length < 10) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtRange(d, de) {
  if (!d) return 'Date TBD';
  const full = { month: 'long', day: 'numeric', year: 'numeric' };
  if (!de || d.getTime() === de.getTime())
    return d.toLocaleDateString('en-US', full);
  if (d.getFullYear() === de.getFullYear() && d.getMonth() === de.getMonth())
    return d.toLocaleDateString('en-US', { month: 'long' }) +
           ' ' + d.getDate() + '–' + de.getDate() +
           ', ' + d.getFullYear();
  return d.toLocaleDateString('en-US',  { month: 'short', day: 'numeric' }) +
         ' – ' +
         de.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ---------------------------------------------------------------------------
   ARCGIS APPLICATION
   ------------------------------------------------------------------------- */
require([
  'esri/config',
  'esri/Map',
  'esri/views/SceneView',
  'esri/layers/GraphicsLayer',
  'esri/Graphic',
  'esri/geometry/Point',
], function (esriConfig, Map, SceneView, GraphicsLayer, Graphic, Point) {

  // esriConfig.apiKey = CFG.API_KEY;  // ← set your key here if needed

  /* ---- Map ---------------------------------------------------------------- */
  // 'streets-dark-3d' is the ArcGIS named 3D basemap: dark streets + extruded buildings
  const map = new Map({ basemap: 'streets-dark-3d', ground: 'world-elevation' });

  /* ---- Scene View --------------------------------------------------------- */
  sceneView = new SceneView({
    container : 'viewDiv',
    map,
    camera: {
      position : { longitude: CFG.INIT_LON, latitude: CFG.INIT_LAT, z: CFG.INIT_Z },
      heading  : 0,
      tilt     : 0,
    },
    environment: {
      background : { type: 'color', color: [0, 0, 0, 1] },
      stars      : 'disabled',
      atmosphere : { quality: 'high' },
      lighting   : { directShadowsEnabled: false, ambientOcclusionEnabled: false },
    },
    ui    : { components: ['attribution'] },
    popup : { disabled: true },
  });

  /* ---- Graphics layers ---------------------------------------------------- */
  const gl         = new GraphicsLayer({ elevationInfo: { mode: 'on-the-ground' } });
  const labelLayer = new GraphicsLayer({ elevationInfo: { mode: 'on-the-ground' } });
  labelLayer.visible = false;   // hidden until camera is below 1 200 km
  map.add(gl);
  map.add(labelLayer);

  // Only events with valid coordinates
  const locatedEvents = EVENTS_DATA.filter(
    e => Math.abs(e.lat) > 0.01 || Math.abs(e.lon) > 0.01
  );

  /* ---- Add all event graphics ---------------------------------------------- */
  function addEventGraphics() {
    locatedEvents.forEach(ev => {
      const idx = EVENTS_DATA.indexOf(ev);
      const pt  = new Point({ longitude: ev.lon, latitude: ev.lat });
      const col = sportColor(ev.sport);

      // 3D point symbol:
      //  • icon layer   — flat coloured circle, screen-space, always visible
      //  • object layer — vertical cone in world-space (metres), appears at street level
      gl.add(new Graphic({
        geometry   : pt,
        symbol     : {
          type        : 'point-3d',
          symbolLayers: [
            {
              type    : 'icon',
              size    : 14,
              resource: { primitive: 'circle' },
              material: { color: col },
              outline : { color: [255, 255, 255, 0.85], size: 2 },
            },
            {
              type    : 'object',
              width   : 30,    // 30 m diameter
              height  : 150,   // 150 m tall cone — visible at street level
              depth   : 30,
              resource: { primitive: 'cone' },
              material: { color: col },
            },
          ],
        },
        attributes : { eventIndex: idx },
      }));

      // Label — in separate layer so camera altitude can toggle it
      const label = ev.title.length > 30
        ? ev.title.slice(0, 28) + '…'
        : ev.title;

      labelLayer.add(new Graphic({
        geometry : pt,
        symbol   : {
          type      : 'text',
          color     : [255, 255, 255, 0.95],
          haloColor : [0, 0, 0, 0.9],
          haloSize  : '2px',
          text      : label,
          yoffset   : 18,
          font      : { size: 10, weight: 'bold', family: 'Arial, Helvetica, sans-serif' },
        },
      }));
    });
  }

  /* ---- Camera fly-to ------------------------------------------------------ */
  function flyTo(idx) {
    curIdx = idx;
    const ev = EVENTS_DATA[idx];
    if (!ev) return;

    highlightCard(idx);

    // Skip events with no geo (multi-city entries)
    if (Math.abs(ev.lat) < 0.01 && Math.abs(ev.lon) < 0.01) return;

    const alt = ev.rank >= 88 ? 1800000
              : ev.rank >= 75 ? 2800000
              :                 4200000;

    sceneView.goTo(
      { position: { longitude: ev.lon, latitude: ev.lat, z: alt }, heading: 0, tilt: 18 },
      { duration: CFG.FLY_MS, easing: 'out-quint' }
    ).catch(() => {});
  }

  /* ---- Close-up fly-to (street level — shows 3D buildings) --------------- */
  function flyToClose(idx) {
    curIdx = idx;
    const ev = EVENTS_DATA[idx];
    if (!ev) return;
    highlightCard(idx);
    if (Math.abs(ev.lat) < 0.01 && Math.abs(ev.lon) < 0.01) return;

    // Tell the SDK that 340 px on the right and 130 px at the bottom are
    // covered by UI, so it centres navigation within the remaining area.
    sceneView.padding = { top: 0, right: 340, bottom: 130, left: 0 };

    // Use TARGET-based goTo (not camera-position-based).
    // The SDK will place the target point at the centre of the padded
    // viewport and compute the correct camera position for that tilt.
    const target = new Point({ longitude: ev.lon, latitude: ev.lat });
    sceneView.goTo(
      { target, scale: 3000, tilt: 60, heading: 0 },
      { duration: CFG.FLY_MS, easing: 'out-quint' }
    ).catch(() => {});
  }

  /* ---- Return to global view ---------------------------------------------- */
  function flyToGlobal() {
    sceneView.padding = { top: 0, right: 0, bottom: 0, left: 0 };
    sceneView.goTo(
      { position: { longitude: CFG.INIT_LON, latitude: CFG.INIT_LAT, z: CFG.INIT_Z },
        heading: 0, tilt: 0 },
      { duration: CFG.FLY_MS, easing: 'out-quint' }
    ).catch(() => {});
  }

  /* ---- Auto mode ---------------------------------------------------------- */
  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      curIdx = (curIdx + 1) % EVENTS_DATA.length;
      flyTo(curIdx);
    }, CFG.AUTO_MS);
  }

  function stopAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
  }

  /* ---- Click handler ------------------------------------------------------ */
  sceneView.on('click', evt => {
    sceneView.hitTest(evt).then(res => {
      const hit = res.results.find(
        r => r.graphic && r.graphic.attributes && r.graphic.attributes.eventIndex != null
      );
      if (hit) {
        const idx = hit.graphic.attributes.eventIndex;
        flyToClose(idx);
        openPopup(idx);
      } else {
        closePopup();
      }
    });
  });

  /* ---- Initialise once view is ready -------------------------------------- */
  // Hard fallback — splash always clears within 12 s even if SceneView stalls
  setTimeout(hideSplash, 12000);

  sceneView.when(() => {
    addEventGraphics();
    buildTicker();
    hideSplash();
    if (isAuto) startAuto();
    // Show labels only when camera is within ~1 200 km of the surface
    sceneView.watch('camera', cam => {
      labelLayer.visible = cam.position.z < 1200000;
    });
  }).catch(() => {
    hideSplash();
    buildTicker();
  });

  /* ---- Splash hide -------------------------------------------------------- */
  function hideSplash() {
    const el = document.getElementById('splash');
    if (el) {
      el.classList.add('hidden');
      setTimeout(() => { el.style.display = 'none'; }, 700);
    }
  }

  /* ---- Controls ----------------------------------------------------------- */
  document.getElementById('btnAuto').addEventListener('click', () => {
    isAuto = !isAuto;
    document.getElementById('btnAuto').classList.toggle('active', isAuto);
    isAuto ? startAuto() : stopAuto();
  });

  document.getElementById('btnAudio').addEventListener('click', () => {
    document.getElementById('btnAudio').classList.toggle('active');
    // Wire audio logic here
  });

  document.getElementById('btnGlobe').addEventListener('click', () => {
    flyToGlobal();
    closePopup();
  });

  /* =========================================================================
     TICKER
     ======================================================================= */
  function buildTicker() {
    const track = document.getElementById('tickerTrack');

    EVENTS_DATA.forEach((ev, idx) => {
      const d   = toDate(ev.startDate);
      const de  = toDate(ev.endDate);
      const mon = d  ? d.toLocaleString('en-US', { month: 'short' }).toUpperCase() : '---';
      const ds  = d  ? d.getDate()  : '--';
      const de2 = de ? de.getDate() : ds;
      const day = (!de || d?.getTime() === de?.getTime() || ds === de2)
                ? String(ds)
                : ds + '–' + de2;
      const yr  = d  ? d.getFullYear() : '----';
      const col = sportColor(ev.sport);

      const card = document.createElement('div');
      card.className   = 'ecard';
      card.dataset.idx = idx;
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', ev.title);
      card.innerHTML =
        '<div class="card-bar" style="background:' + col + '"></div>' +
        '<div class="card-dt">' +
          '<span class="dt-month">' + mon + '</span>' +
          '<span class="dt-day">'   + day + '</span>' +
          '<span class="dt-year">'  + yr  + '</span>' +
        '</div>' +
        '<div class="card-info">' +
          '<div class="ci-title">'  + esc(ev.title)          + '</div>' +
          '<div class="ci-sport">'  + ev.sport.toUpperCase() + '</div>' +
          '<div class="ci-attend">ATTENDANCE: ' + ev.attendance.toLocaleString() + '</div>' +
        '</div>';

      card.addEventListener('click', () => { flyToClose(idx); openPopup(idx); });
      track.appendChild(card);
    });

    enableDragScroll();
  }

  /* -- Scroll the ticker to centre the active card -------------------------------------------------- */
  function highlightCard(idx) {
    document.querySelectorAll('.ecard').forEach(c => c.classList.remove('active'));
    const card = document.querySelector('.ecard[data-idx="' + idx + '"]');
    if (!card) return;
    card.classList.add('active');

    const ticker  = document.getElementById('ticker');
    const track   = document.getElementById('tickerTrack');
    const target  = card.offsetLeft - (ticker.clientWidth / 2) + (card.clientWidth / 2);
    const maxScroll = track.scrollWidth - ticker.clientWidth;
    setTrackX(-Math.max(0, Math.min(target, maxScroll)));
  }

  function setTrackX(x) {
    trackTX = x;
    document.getElementById('tickerTrack').style.transform = 'translateX(' + x + 'px)';
  }

  /* -- Drag-to-scroll -------------------------------------------------------- */
  function enableDragScroll() {
    const ticker = document.getElementById('ticker');
    const track  = document.getElementById('tickerTrack');

    function maxScroll() {
      return -(track.scrollWidth - ticker.clientWidth);
    }

    ticker.addEventListener('mousedown', e => {
      isDragging = true;
      dragStartX = e.clientX - trackTX;
      track.classList.add('dragging');
    });

    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const nx = Math.min(0, Math.max(maxScroll(), e.clientX - dragStartX));
      trackTX = nx;
      track.style.transform = 'translateX(' + nx + 'px)';
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove('dragging');
    });

    // Touch support
    ticker.addEventListener('touchstart', e => {
      isDragging = true;
      dragStartX = e.touches[0].clientX - trackTX;
    }, { passive: true });

    window.addEventListener('touchmove', e => {
      if (!isDragging) return;
      const nx = Math.min(0, Math.max(maxScroll(), e.touches[0].clientX - dragStartX));
      trackTX = nx;
      track.style.transform = 'translateX(' + nx + 'px)';
    }, { passive: true });

    window.addEventListener('touchend', () => { isDragging = false; });
  }

  /* =========================================================================
     NIKE STRATEGIC SCORING
     ======================================================================= */
  function scoreFactors(ev) {
    const today   = new Date();
    const factors = [];

    // 1. Media Exposure — driven by PHQ event rank (0-100)
    const mScore = Math.round(ev.rank || 0);
    factors.push({
      label    : 'Media Exposure',
      score    : mScore,
      rationale: mScore >= 90
        ? 'Global broadcast reaching 100M+ viewers — maximum Nike apparel and logo visibility window'
        : mScore >= 75
        ? 'Major event with broad media coverage and high digital / streaming engagement'
        : 'Growing event with strong community reach and social media amplification potential',
    });

    // 2. Athlete Presence — designated Nike athletes at this event
    const athCount = (ev.athletes || []).length;
    const aScore   = Math.min(99, 12 + athCount * 20);
    const athStr   = athCount
      ? ev.athletes.slice(0, 2).join(', ') + (athCount > 2 ? ' +' + (athCount - 2) + ' more' : '')
      : '';
    factors.push({
      label    : 'Athlete Presence',
      score    : aScore,
      rationale: athCount === 0
        ? 'No current designees — prime opportunity to scout and activate emerging talent on-site'
        : athStr + ' — ' + athCount + ' Nike athlete' + (athCount > 1 ? 's' : '') + ' guarantee on-event brand visibility',
    });

    // 3. Fan Engagement — estimated attendance
    const att    = ev.attendance || 0;
    const fScore = att >= 500000 ? 95 : att >= 200000 ? 85 : att >= 100000 ? 74
                 : att >= 50000  ? 62 : att >= 20000  ? 50 : 35;
    factors.push({
      label    : 'Fan Engagement',
      score    : fScore,
      rationale: att >= 200000
        ? att.toLocaleString() + ' est. attendees — stadium-scale retail activation and experiential marketing'
        : att >= 50000
        ? att.toLocaleString() + ' est. attendees — strong in-venue brand presence and direct consumer touchpoints'
        : att.toLocaleString() + ' est. attendees — targeted community engagement and grassroots brand building',
    });

    // 4. Supply Chain Readiness — days until event start
    const evDate  = toDate(ev.startDate);
    const daysOut = evDate ? Math.round((evDate - today) / 86400000) : 60;
    const sScore  = daysOut > 120 ? 92 : daysOut > 90 ? 80 : daysOut > 60 ? 65
                  : daysOut > 30  ? 48 : daysOut > 14 ? 32 : 18;
    factors.push({
      label    : 'Supply Chain Readiness',
      score    : sScore,
      rationale: daysOut > 120
        ? daysOut + ' days out — full lead time available for complete assortment and regional distribution'
        : daysOut > 60
        ? daysOut + ' days out — adequate window for priority SKU allocation and logistics coordination'
        : daysOut > 30
        ? daysOut + ' days out — expedited fulfillment needed; focus on hero product lines'
        : daysOut + ' days out — critical timeline; execute on in-stock inventory only',
    });

    // 5. Strategic Market Fit — sport category vs Nike priority index
    const sportFit = {
      basketball: 94, tennis: 90, athletics: 87, soccer: 85, skateboarding: 82,
      breaking: 80, paralympic: 78, gymnastics: 74, swimming: 72, golf: 70,
      boxing: 66, cycling: 63, triathlon: 61, fencing: 55,
    };
    const sportKey = (ev.sport || '').toLowerCase().split(',')[0].trim();
    const mktScore = sportFit[sportKey] || 65;
    factors.push({
      label    : 'Strategic Market Fit',
      score    : mktScore,
      rationale: mktScore >= 85
        ? ev.sport + ' is a priority Nike growth category — aligns with global performance and culture narrative'
        : mktScore >= 70
        ? ev.sport + ' is a strategic adjacency with lifestyle crossover and youth audience appeal'
        : ev.sport + ' offers specialist community depth and authentic brand affinity opportunities',
    });

    return factors.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  /* =========================================================================
     POPUP
     ======================================================================= */
  function openPopup(idx) {
    const ev  = EVENTS_DATA[idx];
    if (!ev) return;

    const col = sportColor(ev.sport);
    const d   = toDate(ev.startDate);
    const de  = toDate(ev.endDate);
    const loc = [ev.venueName, ev.city, ev.country].filter(Boolean).join(', ');

    /* Athletes */
    let athHtml = '';
    if (ev.athletes && ev.athletes.length) {
      athHtml += '<hr class="p-divider"><div class="p-ath-hdr">DESIGNATED NIKE ATHLETES</div>';
      ev.athletes.forEach(name => {
        const a   = ATHLETES_DATA[name];
        const ini = (name || '?')[0].toUpperCase();

        const imgTag = (a && a.imageUrl)
          ? '<img class="ath-img" src="' + esc(a.imageUrl) + '" alt="' + esc(name) + '" ' +
            'onerror="this.style.display=\'none\'">'
          : '<span class="ath-init">' + ini + '</span>';

        const detail = [a && a.sport, a && a.nationality].filter(Boolean).join(' · ');
        athHtml +=
          '<div class="ath-row">' +
            imgTag +
            '<div>' +
              '<div class="ath-name">'   + esc(name)   + '</div>' +
              '<div class="ath-detail">' + esc(detail) + '</div>' +
            '</div>' +
          '</div>';
      });
    }

    /* Top 3 Nike Strategic Factors */
    const top3 = scoreFactors(ev);
    let factorHtml = '<hr class="p-divider"><div class="p-ath-hdr">TOP 3 NIKE OPPORTUNITY FACTORS</div>';
    top3.forEach(function (f, i) {
      factorHtml +=
        '<div class="p-factor">' +
          '<div class="p-factor-hdr">' +
            '<span class="p-f-rank">#' + (i + 1) + '</span>' +
            '<span class="p-f-label">' + esc(f.label) + '</span>' +
            '<span class="p-f-score">' + f.score + '</span>' +
          '</div>' +
          '<div class="p-f-bar-bg">' +
            '<div class="p-f-bar" style="width:' + f.score + '%;background:' + col + '"></div>' +
          '</div>' +
          '<div class="p-f-rationale">' + esc(f.rationale) + '</div>' +
        '</div>';
    });

    document.getElementById('popupBody').innerHTML =
      '<div class="p-sport" style="color:' + col + '">' + esc(ev.sport.toUpperCase()) + '</div>' +
      '<div class="p-title">' + esc(ev.title) + '</div>' +
      '<div class="p-meta"><span class="p-icon">&#128197;</span><span>' + fmtRange(d, de) + '</span></div>' +
      '<div class="p-meta"><span class="p-icon">&#128205;</span><span>' + esc(loc) + '</span></div>' +
      '<div class="p-meta"><span class="p-icon">&#128101;</span><span>' +
        ev.attendance.toLocaleString() + ' est. attendance</span></div>' +
      (ev.description ? '<div class="p-desc">' + esc(ev.description) + '</div>' : '') +
      athHtml +
      factorHtml;

    const popup = document.getElementById('popup');
    popup.classList.add('open');
    popup.setAttribute('aria-hidden', 'false');
    popup.scrollTop = 0;
  }

  function closePopup() {
    const popup = document.getElementById('popup');
    popup.classList.remove('open');
    popup.setAttribute('aria-hidden', 'true');
    sceneView.padding = { top: 0, right: 0, bottom: 0, left: 0 };
  }

  document.getElementById('popupClose').addEventListener('click', closePopup);

  // Close popup on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePopup();
  });

}); // end require
