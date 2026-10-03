// Hummingbird collection prototype.
// One set of 363 shapes lives on a canvas. Each view computes a target position for every species;
// the shapes then fly there along gently curved paths. Filters form a trail (taxon / country) that
// narrows which shapes are "active" in every view.

const DATA_URL = "species.json"; // public copy built by scripts/build_public_data.py
const PHOTOS_URL = "photos.json"; // one Wikimedia Commons photo per species, from scripts/fetch_photos.py
const OWN_PHOTOS_URL = "own_photos.json"; // hand-added photos (files in photos/), shown before the Commons one
// Macaulay Library photos by asset number, shown through Macaulay's own embed (the only use their terms allow).
// A last resort for species with no free photo; listed after everything else.
const ML_PHOTOS_URL = "ml_photos.json";
const ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

// Clade names are the informal names used by McGuire et al. (2014) for the nine main clades.
const SUB = {
  Florisuginae:     { clade: "topazes",                          c: ["#ff6a3d", "#ffc65a"] },
  Phaethornithinae: { clade: "hermits",                          c: ["#c49d5f", "#f2deac"] },
  Polytminae:       { clade: "mangoes",                          c: ["#2fe0a0", "#b49bff"] },
  Lesbiinae:        { clade: "coquettes and brilliants",         c: ["#1fae5b", "#7fd94a"] },
  Patagoninae:      { clade: "Patagona",                         c: ["#c3d0de", "#f0cf9c"] },
  Trochilinae:      { clade: "mountain gems, bees and emeralds", c: ["#ff5fbf", "#9cc0ff"] }
};
const TRIBE = ES ? ES_DATA.tribe : { Lesbiini: "coquettes", Heliantheini: "brilliants", Lampornithini: "mountain gems", Mellisugini: "bees", Trochilini: "emeralds" };
if (ES) for (const k in SUB) SUB[k].clade = ES_DATA.clade[k];
const RANK = ES ? { subfamily: "Subfamilia", tribe: "Tribu", genus: "Género" } : { subfamily: "Subfamily", tribe: "Tribe", genus: "Genus" };
const IUCN = ES ? ES_DATA.iucn : { LC: "Least concern", NT: "Near threatened", VU: "Vulnerable", EN: "Endangered", CR: "Critically endangered", EX: "Extinct", DD: "Data deficient", NE: "Not evaluated" };
const MOVES = ES ? ES_DATA.moves : { Sedentary: "Stays put all year", "Partial migrant": "Some populations migrate", Migratory: "Migrates" };
const TOUCH = matchMedia("(hover: none)").matches;
const HINTS = ES ? {
  swarm:  "Todas las especies, con colores por subfamilia. Pasa el cursor sobre una para conocerla y haz clic para abrir su ficha.",
  family: "Los círculos grandes son subfamilias, los punteados son tribus y los pequeños son géneros. Haz clic en un círculo para entrar.",
  world:  "Cada ave está cerca del centro de su área de distribución. Haz clic en un país para ver quién vive ahí.",
  size:   "Del más ligero al más pesado, en escala logarítmica. Un clip pesa alrededor de 1 g.",
  status: "Qué tan a salvo está cada especie, según la Lista Roja de la UICN: preocupación menor a la izquierda, extinto a la derecha."
} : {
  swarm:  "Every species, colored by subfamily. Hover to meet one, click to open its card.",
  family: "Big circles are subfamilies, dashed circles are tribes, small circles are genera. Click a circle to step inside.",
  world:  "Each bird sits near the heart of its range. Click a country to see who lives there.",
  size:   "Lightest to heaviest, on a log scale. A paperclip weighs about 1 g.",
  status: "How safe each species is, from the IUCN Red List: least concern on the left, extinct on the right."
};
// Red List categories in order of risk, with the IUCN's own colors (Extinct lightened to show on the dark sky).
const STATUS = [
  { key: "LC", c: "#60c659" }, { key: "NT", c: "#cce226" }, { key: "VU", c: "#f9e814" },
  { key: "EN", c: "#fc7f3f" }, { key: "CR", c: "#ff4a2e" }, { key: "EX", c: "#8a93a8" },
  { key: "DD", c: "#c9cfdc", label: tx("Not enough data", "Sin datos suficientes"), also: ["NE"] }
];

const S = {
  species: [], byCode: {}, view: "swarm",
  trail: [{ type: "all", label: tx("All hummingbirds", "Todos los colibríes") }],
  active: new Set(), selected: null, hover: null, peek: null, hoverCluster: null, hoverCountry: null,
  deco: null, decoT0: 0, wob: 4,
  // The flock's own clock runs slower when the pointer is near, so birds are easier to catch.
  clock: 0, calm: 1, near: false, rot: 0, last: 0,
  wander: { on: false, timer: 0, path: [], note: null, lastKind: null }
};
const M = { features: [], byIso: {}, proj: null, anchors: {}, alpha: 0,
  t: { k: 1, x: 0, y: 0 }, tFrom: { k: 1, x: 0, y: 0 }, tTo: { k: 1, x: 0, y: 0 }, tT0: 0, tDur: 1300 };

const cv = document.getElementById("stage");
const ctx = cv.getContext("2d");
let W = 0, H = 0, DPR = 1;

const $ = (id) => document.getElementById(id);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// Countries are stored by English name; the Spanish site shows the Spanish name for the same ISO code.
let isoByName = null;
const shortCountry = (c) => {
  if (ES) {
    isoByName ||= Object.fromEntries(S.species.flatMap((s) => s.dist.map((d) => [d.c, d.iso])));
    const es = ES_DATA.country[isoByName[c]];
    if (es) return es;
  }
  return c.replace(/\s*\((UK|US|France|Netherlands)\)/, "");
};
const massOf = (s) => s.mass || 4;
// Address of a species' own page, as written by scripts/build_species_pages.py ("Sword-billed Hummingbird" → species/sword-billed-hummingbird/).
// The Spanish pages live under es/especies/, named after the Spanish name ("Colibrí Picoespada" → colibri-picoespada).
const slugOf = (t) => t.normalize("NFKD").replace(/[^\x00-\x7f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const pageOf = (s) => (ES ? `es/especies/${slugOf(s.es)}/` : `species/${slugOf(s.common)}/`);
// A Commons thumbnail at one of the standard widths Commons serves (250, 330, 500, 960).
function thumb(src, w) {
  if (!/^https?:/.test(src)) return src;
  if (/\/\d+px-[^/]+$/.test(src)) return src.replace(/\/\d+px-([^/]+)$/, `/${w}px-$1`);
  const m = src.match(/^(.*\/commons\/)(.\/..\/)([^/]+)$/);
  return m ? `${m[1]}thumb/${m[2]}${m[3]}/${w}px-${m[3]}` : src;
}
const isFaint = (st) => /Rare|Uncertain|extinct/i.test(st);

function cladeOf(level, value) {
  if (level === "subfamily") return SUB[value].clade;
  if (level === "tribe") return TRIBE[value];
  return calledNames(S.species.filter((s) => s.genus === value)).join(", ");
}
// Plural English names used for a genus, read from the species' own eBird names ("Violetear" → "violetears").
// In Spanish the group word comes first ("Ermitaño Bronceado" → "ermitaños"); the generic "Colibrí" is skipped.
function calledNames(list) {
  if (ES) {
    const words = [...new Set(list.map((s) => s.es.split(" ")[0]))].filter((w) => w !== "Colibrí");
    return words.map((w) => (w = w.toLowerCase(), /z$/.test(w) ? w.slice(0, -1) + "ces" : /[aeiou]$/.test(w) ? w + "s" : w + "es"));
  }
  const words = [...new Set(list.map((s) => s.common.split(" ").pop()))].filter((w) => w !== "Hummingbird");
  return words.map((w) => {
    w = w.toLowerCase();
    if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + "ies";
    if (/(s|x|z|ch|sh)$/.test(w)) return w + "es";
    return w + "s";
  });
}

/* ---------- Setup ---------- */

// Data files are re-checked with the server on every visit, so updates show up right away.
Promise.all([
  fetch(DATA_URL, { cache: "no-cache" }).then((r) => r.json()),
  fetch(ATLAS_URL).then((r) => r.json()).catch(() => null),
  fetch(PHOTOS_URL, { cache: "no-cache" }).then((r) => r.json()).catch(() => ({})),
  fetch(OWN_PHOTOS_URL, { cache: "no-cache" }).then((r) => r.json()).catch(() => ({})),
  fetch(ML_PHOTOS_URL, { cache: "no-cache" }).then((r) => r.json()).catch(() => ({}))
]).then(([species, atlas, photos, own, ml]) => {
  S.species = species;
  S.photos = photos;
  S.ownPhotos = own;
  S.mlPhotos = ml;
  species.forEach((s) => {
    S.byCode[s.code] = s;
    s._ph = Math.random() * Math.PI * 2;
    s._rest = -0.5 + (Math.random() - 0.5) * 0.6;
    s.g = { x: 0, y: 0, r: 0, a: 0, fx: 0, fy: 0, fr: 0, fa: 0, cx: 0, cy: 0,
            to: null, t0: 0, dur: 1, heading: s._rest, flap: 0, sx: 0, sy: 0 };
  });
  if (atlas) {
    const isoById = {};
    for (const [iso, v] of Object.entries(GEO)) isoById[v[2]] = iso;
    M.features = topojson.feature(atlas, atlas.objects.countries).features.filter((f) => {
      const [lon, lat] = d3.geoCentroid(f);
      return lon > -175 && lon < -20 && lat > -62;
    });
    M.features.forEach((f) => { f.iso = isoById[f.id] || null; if (f.iso) M.byIso[f.iso] = f; });
  }
  resize();
  species.forEach((s) => { s.g.x = s.g.sx = W * 0.4 + (Math.random() - 0.5) * 40; s.g.y = s.g.sy = H / 2 + (Math.random() - 0.5) * 40; });
  bindUI();
  bindSearch();
  bindCredits();
  bindLightbox();
  // A link like hummingbirds.world/?species=swbhum1 (from a species page) opens that card.
  // Read it first: drawing the panel resets the address to match what's open.
  const linked = new URLSearchParams(location.search).get("species");
  setView("swarm", { first: true });
  if (linked && S.byCode[linked]) select(linked);
  $("loading").classList.add("done");
  requestAnimationFrame(frame);
});

function resize() {
  DPR = window.devicePixelRatio || 1;
  W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  buildMap();
}

// The side panel's width comes from the stylesheet (--panel-w), which narrows it on medium screens.
const panelWidth = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--panel-w")) || 0;

function stageRect(view) {
  const mobile = W <= 800;
  const x0 = mobile ? 16 : 28;
  const y0 = mobile ? 180 : 104;
  const x1 = W - (mobile ? 16 : panelWidth() + 16 + 28);
  const hintTop = $("hint").getBoundingClientRect().top;
  const y1 = view === "world" ? H - (mobile ? 100 : 108) : mobile && hintTop > 0 ? hintTop - 10 : H - 52;
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

function buildMap() {
  if (!M.features.length) return;
  const R = stageRect("world");
  M.proj = d3.geoMercator().fitExtent([[R.x0, R.y0], [R.x1, R.y1]],
    { type: "MultiPoint", coordinates: [[-124, 47], [-36, -55]] });
  const gp = d3.geoPath(M.proj);
  M.features.forEach((f) => { f.p2d = new Path2D(gp(f)); f.box = gp.bounds(f); });
  for (const [iso, [lat, lon]] of Object.entries(GEO)) {
    const [x, y] = M.proj([lon, lat]);
    let b = [[x - 6, y - 6], [x + 6, y + 6]];
    const f = M.byIso[iso];
    if (f) {
      // Zoom to the largest landmass only (skips Alaska, Hawaii, Galápagos…).
      let main = f;
      if (f.geometry.type === "MultiPolygon") {
        const polys = f.geometry.coordinates.map((c) => ({ type: "Polygon", coordinates: c }));
        main = polys.reduce((a, p) => (d3.geoArea(p) > d3.geoArea(a) ? p : a));
      }
      b = gp.bounds(main);
    }
    M.anchors[iso] = { x, y, b };
  }
}

/* ---------- Filters and the trail ---------- */

function matches(s, f) {
  if (f.type === "taxon") return s[f.level] === f.value;
  if (f.type === "country") return s.dist.some((d) => d.iso === f.iso);
  return true;
}
const countryFilter = () => S.trail.find((f) => f.type === "country");
const deepestTaxon = () => [...S.trail].reverse().find((f) => f.type === "taxon");

function pushFilter(f) {
  if (f.type === "country") S.trail = S.trail.filter((e) => e.type !== "country");
  if (f.type === "taxon") {
    if (S.trail.some((e) => e.type === "taxon" && e.level === f.level && e.value === f.value)) return;
    // A new taxon replaces any taxon filter it doesn't sit inside.
    const sample = S.species.find((s) => s[f.level] === f.value);
    S.trail = S.trail.filter((e) => e.type !== "taxon" || sample[e.level] === e.value);
  }
  S.trail.push(f);
  afterTrailChange();
}
function popTo(i) {
  S.trail = S.trail.slice(0, i + 1);
  afterTrailChange();
}
function afterTrailChange() {
  if (S.selected && !S.trail.every((f) => matches(S.byCode[S.selected], f))) S.selected = null;
  relayout();
  renderTrail(); renderPanel();
}
// Keep only the part of the trail that still contains this species.
function trimTrailFor(s) {
  let i = 0;
  while (i + 1 < S.trail.length && matches(s, S.trail[i + 1])) i++;
  if (i + 1 < S.trail.length) { S.trail = S.trail.slice(0, i + 1); return true; }
  return false;
}

function taxonFilter(level, value) { return { type: "taxon", level, value, label: value }; }
function countryFilterFor(iso) {
  const name = S.species.flatMap((s) => s.dist).find((d) => d.iso === iso).c;
  return { type: "country", iso, name, label: shortCountry(name) };
}

/* ---------- Views and layout ---------- */

function setView(v, opts = {}) {
  S.view = v;
  document.querySelectorAll(".views button").forEach((b) => b.setAttribute("aria-selected", b.dataset.view === v));
  $("hint").textContent = !TOUCH ? HINTS[v] : ES
    ? HINTS[v].replace("Pasa el cursor sobre una para conocerla y haz clic para abrir su ficha", "Toca una para abrir su ficha").replace(/Haz clic en/g, "Toca")
    : HINTS[v].replace("Hover to meet one, click to open its card", "Tap one to open its card").replace(/\bClick\b/g, "Tap");
  relayout(opts);
  renderTrail(); renderPanel(); renderCountries();
}

function relayout(opts = {}) {
  const active = S.species.filter((s) => S.trail.every((f) => matches(s, f)));
  S.active = new Set(active.map((s) => s.code));
  $("count").textContent = active.length === S.species.length ? tx(`${active.length} species`, `${active.length} especies`) : tx(`${active.length} of ${S.species.length} species`, `${active.length} de ${S.species.length} especies`);

  const R = stageRect(S.view);
  let out;
  if (S.view === "swarm") out = layoutSwarm(active, R);
  else if (S.view === "family") out = layoutFamily(active, R);
  else if (S.view === "world") out = layoutWorld(active, R);
  else if (S.view === "status") out = layoutStatus(active, R);
  else out = layoutSize(active, R);

  const now = performance.now();
  const spread = opts.first ? 1400 : opts.quick ? 0 : 380;
  for (const s of S.species) {
    const g = s.g;
    const t = out.targets.get(s.code) || { x: g.x, y: g.y, r: g.r * 0.5, a: 0 };
    g.fx = g.x; g.fy = g.y; g.fr = g.r; g.fa = g.a;
    g.to = t;
    // Curve each flight a little to one side so the flock doesn't move in straight lines.
    const dx = t.x - g.x, dy = t.y - g.y, bend = (Math.random() - 0.5) * 0.5;
    g.cx = (g.x + t.x) / 2 - dy * bend; g.cy = (g.y + t.y) / 2 + dx * bend;
    g.t0 = now + Math.random() * spread;
    g.dur = opts.quick ? 450 : 1000 + Math.random() * 500;
  }
  S.deco = out.deco || null;
  S.decoT0 = now;
  S.rot = 0;

  // Map transform: zoom in on a chosen country, otherwise show the whole Americas.
  M.tFrom = { ...M.t }; M.tT0 = now;
  M.tTo = out.transform || { k: 1, x: 0, y: 0 };
  renderCountries();
}

function radiusFor(s, base) { return base * Math.sqrt(massOf(s) / 5); }

function layoutSwarm(active, R) {
  const list = [...active].sort((a, b) => a.seq - b.seq);
  const outer = Math.min(R.w, R.h) * 0.47;
  const c = outer / Math.sqrt(Math.max(list.length, 1));
  const base = clamp(c * 0.36, 2.5, 9);
  const targets = new Map();
  list.forEach((s, i) => {
    const ang = i * 2.39996, rad = c * Math.sqrt(i + 0.5);
    targets.set(s.code, { x: R.cx + Math.cos(ang) * rad, y: R.cy + Math.sin(ang) * rad, r: radiusFor(s, base), a: 1, rot: true, ox: R.cx, oy: R.cy });
  });
  return { targets };
}

function buildTree(active) {
  const root = { children: [] };
  for (const [sf, tribes] of d3.group(active, (s) => s.subfamily, (s) => s.tribe, (s) => s.genus)) {
    const sfNode = { level: "subfamily", value: sf, children: [] };
    root.children.push(sfNode);
    for (const [tr, genera] of tribes) {
      let parent = sfNode;
      if (tr !== "—") { parent = { level: "tribe", value: tr, children: [] }; sfNode.children.push(parent); }
      for (const [gn, sps] of genera) parent.children.push({ level: "genus", value: gn, children: sps.map((sp) => ({ sp })) });
    }
  }
  return root;
}
function hierarchyOf(data) {
  const h = d3.hierarchy(data).sum((d) => (d.sp ? Math.max(massOf(d.sp), 1.5) : 0));
  h.eachAfter((n) => { n._min = n.data.sp ? n.data.sp.seq : d3.min(n.children, (c) => c._min); });
  return h.sort((a, b) => a._min - b._min);
}

function layoutFamily(active, R) {
  let top = hierarchyOf(buildTree(active));
  // Skip levels that only have one child, so narrowing feels like zooming in.
  // d3.pack reads the parent's position, so the chosen branch is re-rooted before packing.
  let n = top;
  while (n.children && n.children.length === 1 && n.children[0].children) n = n.children[0];
  if (n !== top) top = hierarchyOf(n.data);

  // Genus names only fit once you've zoomed in to a few dozen genera; give them room when shown.
  const showGenus = new Set(active.map((s) => s.genus)).size <= 30;
  const size = Math.min(R.w, R.h) - 40;
  d3.pack().size([size, size]).padding((d) => (d.height <= 1 ? 1.5 : d.height === 2 ? (showGenus ? 18 : 6) : d === top ? 34 : 22))(top);
  // The packed circles fill only part of that square, so scale their actual extent to fill the stage,
  // keeping a margin for the curved labels that sit just outside the outer circles.
  const kids = top.children || [top];
  const ext = (k, f) => f(kids, (d) => d[k] + (f === d3.min ? -d.r : d.r));
  if ((ext("x", d3.max) - ext("x", d3.min) > ext("y", d3.max) - ext("y", d3.min)) !== (R.w > R.h))
    top.each((d) => { [d.x, d.y] = [d.y, d.x]; });
  const bx0 = d3.min(kids, (d) => d.x - d.r), bx1 = d3.max(kids, (d) => d.x + d.r);
  const by0 = d3.min(kids, (d) => d.y - d.r), by1 = d3.max(kids, (d) => d.y + d.r);
  const margin = W <= 800 ? 26 : 40;
  const k = clamp(Math.min((R.w - 2 * margin) / (bx1 - bx0), (R.h - 2 * margin) / (by1 - by0)), 0.5, 2.5);
  const X = (x) => R.cx + (x - (bx0 + bx1) / 2) * k;
  const Y = (y) => R.cy + 10 + (y - (by0 + by1) / 2) * k;

  const targets = new Map();
  const leaves = [];
  top.leaves().forEach((l) => {
    if (!l.data.sp) return;
    const t = { x: X(l.x), y: Y(l.y), r: Math.min(l.r * k * 0.74, 40), a: 1 };
    targets.set(l.data.sp.code, t);
    leaves.push(t);
  });
  const clusters = top.descendants().filter((d) => d !== top && d.children && d.data.level).map((d) => ({
    x: X(d.x), y: Y(d.y), r: d.r * k, level: d.data.level, value: d.data.value, count: d.leaves().length,
    color: SUB[d.leaves()[0].data.sp.subfamily].c[0],
    parent: d.parent && d.parent !== top ? { x: X(d.parent.x), y: Y(d.parent.y), r: d.parent.r * k } : null
  }));
  setLabelScale(clamp((size * k) / 680, 0.62, 1));
  placeClusterLabels(clusters, leaves, R, showGenus);
  return { targets, deco: { kind: "family", clusters } };
}

/* Labels curve along the top of each circle, in the gap the packing leaves between circles,
   so they never sit on top of birds. A circle too small for its label gets a stacked label
   beside it instead (subfamilies only), placed where it covers the fewest birds. */
// Label sizes scale with the chart, so a phone-sized tree isn't buried in text.
let LS = 1;
let LABEL_FONTS;
function setLabelScale(k) {
  LS = k;
  const px = (n) => `${Math.round(n * k * 10) / 10}px`;
  LABEL_FONTS = {
    rank: `600 ${px(10)} 'IBM Plex Sans', sans-serif`,
    subfamily: `600 ${px(18)} Newsreader, serif`,
    tribe: `600 ${px(15)} Newsreader, serif`,
    genus: `italic 600 ${px(14)} Newsreader, serif`,
    clade: `italic ${px(14)} Newsreader, serif`,
    cladeSmall: `italic ${px(12.5)} Newsreader, serif`
  };
}
setLabelScale(1);
const COL = { rank: "#a9bbe6", name: "#ffffff", clade: "#c3d0ef" };

// Label variants, longest first: 0 = rank, name and clade; 1 = rank and name; 2 = name only.
function arcSegments(c, v) {
  const short = v > 0;
  if (v === 2) return [{ t: c.value, f: LABEL_FONTS[c.level], col: COL.name }];
  if (c.level === "genus") {
    const called = cladeOf("genus", c.value);
    return short || !called ? [{ t: c.value, f: LABEL_FONTS.genus, col: COL.name }]
      : [{ t: c.value, f: LABEL_FONTS.genus, col: COL.name }, { t: "  " + called, f: LABEL_FONTS.cladeSmall, col: COL.clade }];
  }
  const segs = [{ t: RANK[c.level].toUpperCase() + "  ", f: LABEL_FONTS.rank, col: COL.rank, ls: 1.5 },
                { t: c.value, f: LABEL_FONTS[c.level], col: COL.name }];
  // A subfamily split into tribes doesn't repeat its clade names: the tribe labels already show them.
  const hasTribes = c.level === "subfamily" && S.species.some((s) => s.subfamily === c.value && s.tribe !== "—");
  if (!short && !hasTribes) segs.push({ t: "  " + cladeOf(c.level, c.value), f: LABEL_FONTS.clade, col: COL.clade });
  return segs;
}
// Width of every character, so the text can be laid out letter by letter along the arc.
function measureSegments(segs) {
  const glyphs = [];
  for (const sg of segs) {
    ctx.font = sg.f;
    for (const ch of sg.t) glyphs.push({ ch, f: sg.f, col: sg.col, w: ctx.measureText(ch).width + (sg.ls || 0) });
  }
  return glyphs;
}
function stackLines(c) {
  return [
    { t: RANK[c.level].toUpperCase(), f: LABEL_FONTS.rank, h: 13 * LS, col: COL.rank, ls: "1.5px" },
    { t: c.value, f: LABEL_FONTS[c.level], h: 21 * LS, col: COL.name },
    { t: cladeOf(c.level, c.value), f: LABEL_FONTS.clade, h: 16 * LS, col: COL.clade }
  ];
}

function placeClusterLabels(clusters, leaves, R, showGenus, first = []) {
  const offset = { subfamily: 13, tribe: 9, genus: 8 };
  // Tribes first: they have the least room, and a subfamily label can still move to the bottom.
  const order = { tribe: 0, subfamily: 1, genus: 2 };
  const placed = [];
  const overlaps = (a, p) => a.x0 < p.x1 && a.x1 > p.x0 && a.y0 < p.y1 && a.y1 > p.y0;
  const hits = (boxes) => boxes.some((b) => placed.some((p) => overlaps(b, p)));
  // An arc label is covered by a chain of small boxes along the curve, so it doesn't claim the circle's inside.
  const arcBoxes = (c, radius, span, bottom) => {
    const half = Math.max(7, ({ subfamily: 18, tribe: 15, genus: 14 }[c.level] * LS) / 2 + 3);
    const n = Math.max(3, Math.ceil((span * radius) / 14)), out = [];
    const centre = bottom ? Math.PI / 2 : -Math.PI / 2;
    for (let i = 0; i < n; i++) {
      const b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
      for (const t of [i / n, (i + 1) / n]) {
        const ang = centre - span / 2 + span * t;
        for (const rr of [radius - half, radius + half]) {
          const x = c.x + Math.cos(ang) * rr, y = c.y + Math.sin(ang) * rr;
          b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x); b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y);
        }
      }
      out.push(b);
    }
    return out;
  };
  // Within tribes the smallest circle chooses first, since it has the fewest spots that fit.
  // Subfamilies left without a label on an earlier pass (\`first\`) choose before the other subfamilies.
  const rank = (c) => order[c.level] - (first.includes(c) ? 0.5 : 0);
  for (const c of [...clusters].sort((a, b) => rank(a) - rank(b) || (a.level === "tribe" ? a.r - b.r : b.r - a.r))) {
    if (c.level === "genus" && !showGenus) continue;
    // On phones a tiny subfamily circle gets the stacked label: a name curled round it is hard to pin to it.
    const maxSpan = c.level === "subfamily" && W <= 800 && c.r < 20 ? 0 : Math.PI * (c.level === "subfamily" ? (W <= 800 ? 0.95 : 1.2) : 0.9);
    // Prefer the full label along the top, then shorter ones, then the same along the bottom.
    tries: for (const bottom of [false, true]) {
      // Text along the bottom sits outside the circle too, so its baseline needs a little more room.
      const radius = c.r + (offset[c.level] + (bottom ? 3 : 0)) * LS;
      for (const v of [0, 1, 2]) {
        const glyphs = measureSegments(arcSegments(c, v));
        const span = glyphs.reduce((a, g) => a + g.w, 0) / radius;
        if (span >= maxSpan) continue;
        const boxes = arcBoxes(c, radius, span, bottom);
        if (hits(boxes)) continue;
        placed.push(...boxes);
        c.lab = { mode: "arc", glyphs, radius, span, bottom };
        break tries;
      }
    }
    if (c.lab || c.level !== "subfamily") continue;

    // Small subfamily: stacked label beside the circle, wherever it covers the fewest birds.
    const lines = stackLines(c);
    let w = 0;
    for (const l of lines) { ctx.font = l.f; ctx.letterSpacing = l.ls || "0px"; w = Math.max(w, ctx.measureText(l.t).width); }
    ctx.letterSpacing = "0px";
    const h = lines.reduce((a, l) => a + l.h, 0);
    // Straight above, beside or below first; the diagonals are fallbacks for crowded corners.
    const dx = c.r * 0.7 + w / 2 + 6, dy = c.r * 0.7 + h / 2 + 4;
    const spots = [[c.x, c.y - c.r - h / 2 - 6], [c.x - c.r - w / 2 - 10, c.y], [c.x + c.r + w / 2 + 10, c.y], [c.x, c.y + c.r + h / 2 + 6],
                   [c.x - dx, c.y - dy], [c.x + dx, c.y - dy], [c.x - dx, c.y + dy], [c.x + dx, c.y + dy],
                   [c.x, c.y - c.r - h / 2 - 34], [c.x, c.y + c.r + h / 2 + 34]];
    let best = null;
    spots.forEach(([x, y], i) => {
      const box = { x0: x - w / 2 - 3, x1: x + w / 2 + 3, y0: y - h / 2, y1: y + h / 2 };
      // A spot that hits another label, sits inside another subfamily or runs off screen is ruled out.
      let score = i, ruledOut = hits([box]);
      // Gap between the label and a circle's edge; the label must sit nearer its own circle than any other.
      const gapTo = (o) => Math.hypot(clamp(o.x, box.x0, box.x1) - o.x, clamp(o.y, box.y0, box.y1) - o.y) - o.r;
      const own = gapTo(c);
      for (const o of clusters) {
        if (o === c || o.level !== "subfamily") continue;
        if (gapTo(o) < own) score += 300;
        const nx = clamp(o.x, box.x0, box.x1), ny = clamp(o.y, box.y0, box.y1);
        const d = Math.hypot(nx - o.x, ny - o.y);
        if (d < o.r - 12) ruledOut = true;
        else if (d < o.r + 14) score += 200;
      }
      for (const b of leaves) {
        const nx = clamp(b.x, box.x0, box.x1), ny = clamp(b.y, box.y0, box.y1);
        if (Math.hypot(nx - b.x, ny - b.y) < b.r + 1) score += 5;
      }
      if (box.x0 < 4 || box.x1 > W - 4) ruledOut = true;
      else if (box.x1 > R.x1 + 20 || box.y0 < 60 || box.y1 > H - 8) score += 400;
      if (!ruledOut && (!best || score < best.score)) best = { score, x, y, box };
    });
    if (!best) continue;
    placed.push(best.box);
    c.lab = { mode: "stack", x: best.x, y: best.y - h / 2, lines, box: best.box };
  }
  // A crowded corner can leave a small subfamily unnamed; try once more with it choosing early.
  const missing = clusters.filter((c) => c.level === "subfamily" && !c.lab);
  if (missing.length && !first.length) {
    clusters.forEach((c) => delete c.lab);
    placeClusterLabels(clusters, leaves, R, showGenus, missing);
  }
}

function homePoint(s) {
  // Weighted centre of the countries a species lives in; residents and breeders count most.
  let sx = 0, sy = 0, sw = 0;
  for (const d of s.dist) {
    const a = M.anchors[d.iso]; if (!a) continue;
    const st = d.st;
    const w = (/Resident|Breeding/.test(st) ? 1 : /Present|Regular|Winter|Passage/.test(st) ? 0.5 : 0.03) * Math.log(2 + (d.n || 0));
    sx += a.x * w; sy += a.y * w; sw += w;
  }
  return sw ? { x: sx / sw, y: sy / sw } : { x: 0, y: 0 };
}

function layoutWorld(active, R) {
  const cf = countryFilter();
  let transform = { k: 1, x: 0, y: 0 };
  if (cf && M.anchors[cf.iso]) {
    const [[bx0, by0], [bx1, by1]] = M.anchors[cf.iso].b;
    const bw = Math.max(bx1 - bx0, 8), bh = Math.max(by1 - by0, 8);
    const k = clamp(Math.min(R.w / bw, R.h / bh) * 0.5, 1, 9);
    transform = { k, x: R.cx - k * (bx0 + bx1) / 2, y: R.cy - k * (by0 + by1) / 2 };
  }
  const toScreen = (p) => ({ x: p.x * transform.k + transform.x, y: p.y * transform.k + transform.y });
  const base = clamp(Math.min(R.w, R.h) / 150, 2.6, 5.5) * (cf ? 1.5 : 1);

  const nodes = active.map((s) => {
    const home = cf ? toScreen(M.anchors[cf.iso]) : toScreen(homePoint(s));
    return { s, hx: home.x, hy: home.y, x: home.x + (Math.random() - 0.5) * 4, y: home.y + (Math.random() - 0.5) * 4, r: radiusFor(s, base) };
  });
  const sim = d3.forceSimulation(nodes).stop()
    .force("x", d3.forceX((n) => n.hx).strength(cf ? 0.08 : 0.25))
    .force("y", d3.forceY((n) => n.hy).strength(cf ? 0.08 : 0.25))
    .force("c", d3.forceCollide((n) => n.r + 1.2).iterations(2));
  for (let i = 0; i < 220; i++) sim.tick();

  const targets = new Map();
  nodes.forEach((n) => {
    let a = 1;
    if (cf && isFaint(n.s.dist.find((x) => x.iso === cf.iso).st)) a = 0.45;
    targets.set(n.s.code, { x: n.x, y: n.y, r: n.r, a });
  });
  return { targets, transform, deco: { kind: "world" } };
}

function layoutSize(active, R) {
  const base = clamp(Math.min(R.w, R.h) / 140, 2.6, 6);
  const withMass = active.filter((s) => s.mass);
  if (R.h > R.w * 1.3) return layoutSizeTall(withMass, R, base);
  const x = d3.scaleLog().domain([1.8, 21]).range([R.x0 + 40, R.x1 - 40]);
  const nodes = withMass.map((s) => ({ s, tx: x(s.mass), x: x(s.mass), y: R.cy + (Math.random() - 0.5) * 10, r: radiusFor(s, base) }));
  const sim = d3.forceSimulation(nodes).stop()
    .force("x", d3.forceX((n) => n.tx).strength(1))
    .force("y", d3.forceY(R.cy - 10).strength(0.05))
    .force("c", d3.forceCollide((n) => n.r + 0.8).iterations(3));
  for (let i = 0; i < 260; i++) sim.tick();
  const targets = new Map();
  nodes.forEach((n) => targets.set(n.s.code, { x: n.x, y: n.y, r: n.r, a: 1 }));
  const bottom = nodes.length ? d3.max(nodes, (n) => n.y + n.r) : R.cy;
  const top = nodes.length ? d3.min(nodes, (n) => n.y - n.r) : R.cy;
  return { targets, deco: { kind: "size", x, axisY: Math.min(bottom + 28, R.y1 - 4), top, pins: sizePins(withMass) } };
}
// The lightest and heaviest birds, plus a few everyone knows, get their names pinned on.
function sizePins(withMass) {
  const sorted = [...withMass].sort((a, b) => a.mass - b.mass);
  const pins = new Set();
  if (sorted.length) { pins.add(sorted[0].code); pins.add(sorted[sorted.length - 1].code); }
  for (const name of ["Bee Hummingbird", "Giant Hummingbird", "Ruby-throated Hummingbird"]) {
    const s = withMass.find((s) => s.common === name); if (s) pins.add(s.code);
  }
  return [...pins].sort((a, b) => S.byCode[a].mass - S.byCode[b].mass);
}
// Tall screens (phones): the scale runs up the left side, heaviest at the top, and the swarm spreads sideways.
function layoutSizeTall(withMass, R, base) {
  const axisX = R.x0 + 34;
  const y = d3.scaleLog().domain([1.8, 21]).range([R.y1 - 20, R.y0 + 30]);
  const cx = (axisX + R.x1) / 2;
  const nodes = withMass.map((s) => ({ s, ty: y(s.mass), y: y(s.mass), x: cx + (Math.random() - 0.5) * 10, r: radiusFor(s, base * 1.25) }));
  const sim = d3.forceSimulation(nodes).stop()
    .force("y", d3.forceY((n) => n.ty).strength(1))
    .force("x", d3.forceX(cx).strength(0.05))
    .force("c", d3.forceCollide((n) => n.r + 0.8).iterations(3));
  for (let i = 0; i < 260; i++) sim.tick();
  // Slide the swarm up against the scale, leaving the right-hand side free for the pinned names.
  const shift = nodes.length ? axisX + 16 - d3.min(nodes, (n) => n.x - n.r) : 0;
  const targets = new Map();
  nodes.forEach((n) => targets.set(n.s.code, { x: n.x + shift, y: n.y, r: n.r, a: 1 }));
  return { targets, deco: { kind: "size", tall: true, y, axisX, pins: sizePins(withMass) } };
}

// The same color a category has on the Status view's scale.
function statusColor(code) { return (STATUS.find((g) => g.key === code || (g.also || []).includes(code)) || STATUS.at(-1)).c; }

// One column per Red List category, birds stacked from the scale upward like a picture chart.
// Least concern holds most species, so it gets a wider column; every bird is drawn the same size.
function layoutStatus(active, R) {
  const groups = STATUS.map((g) => ({ ...g, list: active.filter((s) => s.iucn === g.key || (g.also || []).includes(s.iucn)).sort((a, b) => a.seq - b.seq) }));
  const units = groups.map((g) => (g.key === "LC" ? 3 : 1));
  const gap = 18, unitW = (R.w - gap * (groups.length - 1)) / d3.sum(units);
  const top = R.y0 + 30, axisY = R.y1 - (W <= 800 ? 44 : 46);
  let x = R.x0;
  groups.forEach((g, i) => { g.x0 = x; g.w = units[i] * unitW; x += g.w + gap; });
  // Largest cell that lets every column fit between the top and the scale.
  let cell = 30;
  const fits = (c) => groups.every((g) => Math.ceil(g.list.length / Math.max(1, Math.floor(g.w / c))) * c <= axisY - 14 - top);
  while (cell > 6 && !fits(cell)) cell -= 0.5;
  const r = cell * 0.36, targets = new Map();
  for (const g of groups) {
    const cols = Math.max(1, Math.min(Math.floor(g.w / cell), g.list.length));
    const left = g.x0 + (g.w - cols * cell) / 2;
    g.list.forEach((s, i) => {
      const row = Math.floor(i / cols), col = i % cols;
      targets.set(s.code, { x: left + (col + 0.5) * cell, y: axisY - 14 - (row + 0.5) * cell, r, a: 1 });
    });
    g.topY = axisY - 14 - Math.ceil(g.list.length / cols) * cell;
  }
  return { targets, deco: { kind: "status", groups, axisY } };
}

/* ---------- Animation loop ---------- */

function currentTarget(g) {
  const t = g.to;
  if (!t.rot) return t;
  const dx = t.x - t.ox, dy = t.y - t.oy, c = Math.cos(S.rot), s = Math.sin(S.rot);
  return { x: t.ox + dx * c - dy * s, y: t.oy + dx * s + dy * c, r: t.r, a: t.a };
}

function frame(now) {
  const dt = Math.min(now - (S.last || now), 50);
  S.last = now;
  S.calm += ((S.hover ? 0.06 : S.near ? 0.3 : 1) - S.calm) * 0.12;
  S.clock += dt * S.calm;
  S.rot += dt * S.calm * 0.00004;

  // Map zoom
  const mp = ease(clamp((now - M.tT0) / M.tDur, 0, 1));
  // Zoom along a smooth "fly-to" path (d3.interpolateZoom), so the place we're heading to stays in
  // view the whole way. Animating position and scale separately let the view drift over empty ocean.
  if (M.ziT0 !== M.tT0) {
    const view = (v) => [(W / 2 - v.x) / v.k, (H / 2 - v.y) / v.k, W / v.k];
    M.zi = d3.interpolateZoom(view(M.tFrom), view(M.tTo)); M.ziT0 = M.tT0;
  }
  const [zcx, zcy, zw] = M.zi(mp), zk = W / zw;
  M.t = { k: zk, x: W / 2 - zcx * zk, y: H / 2 - zcy * zk };
  M.alpha += ((S.view === "world" ? 1 : 0) - M.alpha) * 0.06;
  S.wob += ((S.view === "swarm" ? 4 : 1.2) - S.wob) * 0.03;

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (M.alpha > 0.01) drawMap();

  const decoA = clamp((now - S.decoT0 - 600) / 600, 0, 1);
  if (S.deco?.kind === "family") drawClusters(decoA);

  // Move every bird
  const tc = S.clock;
  for (const s of S.species) {
    const g = s.g;
    if (!g.to) continue;
    const tgt = currentTarget(g);
    const p = ease(clamp((now - g.t0) / g.dur, 0, 1));
    const q = 1 - p;
    g.x = q * q * g.fx + 2 * q * p * g.cx + p * p * tgt.x;
    g.y = q * q * g.fy + 2 * q * p * g.cy + p * p * tgt.y;
    g.r = g.fr + (tgt.r - g.fr) * p;
    g.a = g.fa + (tgt.a - g.fa) * p;
    const amp = S.wob * (0.6 + 0.4 * Math.min(g.r / 6, 1.5));
    const sx = g.x + Math.sin(tc * 0.0007 + s._ph) * amp;
    const sy = g.y + Math.cos(tc * 0.00055 + s._ph * 1.7) * amp * 0.8;
    const vx = sx - g.sx, vy = sy - g.sy, speed = Math.hypot(vx, vy);
    g.sx = sx; g.sy = sy;
    const want = speed > 0.6 ? Math.atan2(vy, vx) : s._rest + Math.sin(tc * 0.0004 + s._ph) * 0.25;
    let d = want - g.heading; d = Math.atan2(Math.sin(d), Math.cos(d));
    g.heading += d * (speed > 0.6 ? 0.18 : 0.03);
    g.flap += (clamp(speed / 2.5, 0, 1) - g.flap) * 0.15;
  }

  for (const s of S.species) {
    const g = s.g;
    if (g.a < 0.01) continue;
    const grow = s.code === S.hover ? 1.35 : 1;
    drawBird(ctx, s, g.sx, g.sy, g.r * grow, g.a, g.heading, g.flap, now);
  }

  if (S.deco?.kind === "family") drawClusterLabels(decoA);
  if (S.deco?.kind === "size") drawSizeAxis(decoA);
  if (S.deco?.kind === "status") drawStatusScale(decoA);
  if (S.view === "world" && M.alpha > 0.5) drawCountryLabels();
  drawWanderPath();

  const hv = S.hover && S.byCode[S.hover].g;
  if (hv) ring(hv.sx, hv.sy, hv.r * 1.35 + 5, "rgba(255,255,255,0.9)", 1.5);
  const pk = S.peek && S.byCode[S.peek].g;
  if (pk) ring(pk.sx, pk.sy, pk.r + 6, "rgba(127,224,196,0.95)", 2);
  const sel = S.selected && S.byCode[S.selected].g;
  if (sel) {
    const pulse = 1 + Math.sin(now * 0.004) * 0.15;
    ring(sel.sx, sel.sy, (sel.r + 7) * pulse, "rgba(255,255,255,0.95)", 2);
    ring(sel.sx, sel.sy, (sel.r + 13) * pulse, "rgba(255,255,255,0.25)", 1);
  }

  drawCardBird(now);
  requestAnimationFrame(frame);
}

function ring(x, y, r, color, w) {
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color; ctx.lineWidth = w;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
}

// A hummingbird reduced to a shimmering body, a bill scaled to the real bill length, a tail and blurred wings.
function drawBird(c, s, x, y, r, a, h, flap, now) {
  if (r < 0.3 || !Number.isFinite(x + y + r)) return;
  const [c1, c2] = SUB[s.subfamily].c;
  const ch = Math.cos(h), sh = Math.sin(h);
  c.globalAlpha = a;

  if (flap > 0.08) {
    const beat = 0.6 + 0.4 * Math.sin(now * 0.09 + s._ph);
    c.fillStyle = `rgba(255,255,255,${0.18 * flap})`;
    c.beginPath(); c.ellipse(x - ch * r * 0.2, y - sh * r * 0.2, r * 0.55, r * (1.2 + 0.9 * beat), h, 0, Math.PI * 2); c.fill();
  }
  // Tail
  c.fillStyle = c1;
  c.globalAlpha = a * 0.8;
  const bx = x - ch * r * 0.8, by = y - sh * r * 0.8;
  c.beginPath();
  c.moveTo(bx - sh * r * 0.35, by + ch * r * 0.35);
  c.lineTo(bx + sh * r * 0.35, by - ch * r * 0.35);
  c.lineTo(x - ch * r * 1.75, y - sh * r * 1.75);
  c.closePath(); c.fill();
  c.globalAlpha = a;
  // Bill
  const bill = r * (0.35 + (s.bill || 18) / 30);
  c.strokeStyle = "rgba(235,232,220,0.9)";
  c.lineWidth = Math.max(0.7, r * 0.17);
  c.lineCap = "round";
  c.beginPath(); c.moveTo(x + ch * r * 0.9, y + sh * r * 0.9); c.lineTo(x + ch * (r + bill), y + sh * (r + bill)); c.stroke();
  // Body with a gradient that slowly turns, so the color shifts like iridescence
  const ang = now * 0.0011 + s._ph;
  const gx = Math.cos(ang) * r * 1.1, gy = Math.sin(ang) * r * 1.1;
  const grad = c.createLinearGradient(x - gx, y - gy, x + gx, y + gy);
  grad.addColorStop(0, c1); grad.addColorStop(0.5, c2); grad.addColorStop(1, c1);
  c.fillStyle = grad;
  c.beginPath(); c.ellipse(x, y, r * 1.12, r * 0.88, h, 0, Math.PI * 2);
  if (s.extinct) { c.globalAlpha = a * 0.25; c.fill(); c.globalAlpha = a; c.strokeStyle = c2; c.lineWidth = 1; c.stroke(); }
  else c.fill();
  // Glint
  if (r > 2.5) {
    c.fillStyle = "rgba(255,255,255,0.55)";
    c.beginPath(); c.arc(x + ch * r * 0.35 + sh * r * 0.3, y + sh * r * 0.35 - ch * r * 0.3, r * 0.18, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
}

function drawMap() {
  const { k, x, y } = M.t;
  const cf = countryFilter();
  const counts = countryCounts();
  const max = d3.max(Object.values(counts)) || 1;
  ctx.save();
  ctx.globalAlpha = M.alpha;
  ctx.setTransform(DPR * k, 0, 0, DPR * k, DPR * x, DPR * y);
  ctx.lineWidth = 0.7 / k;
  // Only countries on screen are drawn. Zoomed in, off-screen countries become huge shapes that can
  // make the browser drop the whole map for a frame.
  const vx0 = -x / k, vy0 = -y / k, vx1 = (W - x) / k, vy1 = (H - y) / k;
  for (const f of M.features) {
    const [[bx0, by0], [bx1, by1]] = f.box;
    if (bx1 < vx0 || bx0 > vx1 || by1 < vy0 || by0 > vy1) continue;
    ctx.fillStyle = "#172c63";
    ctx.fill(f.p2d);
    const n = f.iso && counts[f.iso];
    if (n) { ctx.fillStyle = `rgba(127,224,196,${0.03 + 0.12 * Math.sqrt(n / max)})`; ctx.fill(f.p2d); }
    if (cf && f.iso === cf.iso) { ctx.fillStyle = "rgba(127,224,196,0.22)"; ctx.fill(f.p2d); }
    if (S.hoverCountry && f.iso === S.hoverCountry) { ctx.fillStyle = "rgba(255,255,255,0.10)"; ctx.fill(f.p2d); }
    ctx.strokeStyle = "rgba(170,200,255,0.28)";
    ctx.stroke(f.p2d);
  }
  ctx.restore();
}

function drawCountryLabels() {
  const cf = countryFilter();
  const counts = countryCounts();
  for (const [iso, a] of Object.entries(M.anchors)) {
    if (!counts[iso]) continue;
    const x = a.x * M.t.k + M.t.x, y = a.y * M.t.k + M.t.y;
    const hot = iso === S.hoverCountry;
    // Territories with no polygon of their own get a small dot to click.
    if (!M.byIso[iso] || hot) {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = hot ? "#fff" : "rgba(127,224,196,0.8)";
      ctx.beginPath(); ctx.arc(x, y, hot ? 4 : 2.5, 0, Math.PI * 2); ctx.fill();
    }
    const chosen = cf && cf.iso === iso;
    if (hot || chosen) {
      const name = shortCountry(S.species.flatMap((s) => s.dist).find((d) => d.iso === iso).c);
      // The chosen country's label sits just above its flock and stays put while the pointer moves,
      // whether or not the pointer is over that country.
      let ly = y - 12;
      if (chosen) {
        const top = d3.min(S.species, (s) => (S.active.has(s.code) && s.g.a > 0.3 ? s.g.sy - s.g.r : null));
        ly = Math.max(stageRect("world").y0 + 4, Math.min(y, top ?? y) - 16);
      }
      pill(`${name} · ${counts[iso]} ${tx("species", "especies")}`, x, ly);
    }
  }
  ctx.globalAlpha = 1;
}

function pill(text, x, y, opts = {}) {
  ctx.font = opts.font || "500 13px 'IBM Plex Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const w = ctx.measureText(text).width;
  x = clamp(x, w / 2 + 10, Math.min(stageRect(S.view).x1 + 12, W - 10) - w / 2);
  ctx.globalAlpha = (opts.alpha ?? 1) * 0.9;
  ctx.fillStyle = "rgba(6,14,40,0.9)";
  ctx.beginPath(); ctx.roundRect(x - w / 2 - 7, y - 11, w + 14, 22, 11); ctx.fill();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.fillStyle = opts.color || "#eef2ff";
  ctx.fillText(text, x, y + 0.5);
  ctx.globalAlpha = 1;
}

// Circles are styled by rank: subfamilies tinted in their color, tribes dashed, genera faint.
function drawClusters(a) {
  for (const c of S.deco.clusters) {
    const hot = S.hoverCluster === c;
    const c1 = c.color;
    ctx.globalAlpha = a;
    ctx.setLineDash(c.level === "tribe" ? [5, 5] : []);
    if (c.level === "subfamily") {
      ctx.fillStyle = c1 + (hot ? "22" : "12");
      ctx.strokeStyle = c1 + (hot ? "cc" : "77");
      ctx.lineWidth = 1.5;
    } else if (c.level === "tribe") {
      ctx.fillStyle = hot ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.025)";
      ctx.strokeStyle = hot ? "rgba(220,230,255,0.8)" : "rgba(200,215,255,0.38)";
      ctx.lineWidth = 1.2;
    } else {
      ctx.fillStyle = hot ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.025)";
      ctx.strokeStyle = hot ? "rgba(220,230,255,0.75)" : "rgba(200,215,255,0.16)";
      ctx.lineWidth = 1;
    }
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

// Text with a soft halo in the background color, so it stays readable over lines.
function drawClusterLabels(a) {
  ctx.lineJoin = "round";
  for (const c of S.deco.clusters) {
    const lab = c.lab;
    if (!lab) continue;
    const hot = S.hoverCluster === c;
    if (lab.mode === "arc") {
      // Letters run left to right, centred on 12 o'clock (or 6 o'clock along the bottom, kept upright).
      const dir = lab.bottom ? -1 : 1;
      let ang = lab.bottom ? Math.PI / 2 + lab.span / 2 : -Math.PI / 2 - lab.span / 2;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const g of lab.glyphs) {
        const mid = ang + (dir * g.w) / 2 / lab.radius;
        ctx.save();
        ctx.translate(c.x + Math.cos(mid) * lab.radius, c.y + Math.sin(mid) * lab.radius);
        ctx.rotate(mid + (dir * Math.PI) / 2);
        ctx.font = g.f;
        ctx.globalAlpha = a * 0.9; ctx.strokeStyle = "rgba(7,17,48,0.9)"; ctx.lineWidth = 4;
        ctx.strokeText(g.ch, 0, 0);
        ctx.globalAlpha = a; ctx.fillStyle = hot ? "#7fe0c4" : g.col;
        ctx.fillText(g.ch, 0, 0);
        ctx.restore();
        ang += (dir * g.w) / lab.radius;
      }
    } else {
      // Thin leader line from the label to its circle, so it's clear which circle it names.
      const bx = clamp(c.x, lab.box.x0, lab.box.x1), by = clamp(c.y, lab.box.y0, lab.box.y1);
      const d = Math.hypot(bx - c.x, by - c.y);
      if (d > c.r + 4) {
        ctx.globalAlpha = a * 0.6; ctx.strokeStyle = c.color; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bx, by);
        ctx.lineTo(c.x + ((bx - c.x) / d) * (c.r + 2), c.y + ((by - c.y) / d) * (c.r + 2)); ctx.stroke();
      }
      let y = lab.y;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      for (const l of lab.lines) {
        ctx.font = l.f; ctx.letterSpacing = l.ls || "0px";
        ctx.globalAlpha = a * 0.9; ctx.strokeStyle = "rgba(7,17,48,0.9)"; ctx.lineWidth = 5;
        ctx.strokeText(l.t, lab.x, y);
        ctx.globalAlpha = a; ctx.fillStyle = hot && l.col === COL.name ? "#7fe0c4" : l.col;
        ctx.fillText(l.t, lab.x, y);
        y += l.h;
      }
      ctx.letterSpacing = "0px";
    }
  }
  ctx.globalAlpha = 1;
}

function drawSizeAxis(a) {
  if (S.deco.tall) return drawSizeAxisTall(a);
  const d = S.deco, x = d.x, y = d.axisY;
  ctx.globalAlpha = a * 0.5;
  ctx.strokeStyle = "#d4def5"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x.range()[0], y); ctx.lineTo(x.range()[1], y); ctx.stroke();
  ctx.font = "13px 'IBM Plex Sans', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
  for (const t of [2, 3, 4, 5, 6, 8, 10, 15, 20]) {
    ctx.globalAlpha = a * 0.5;
    ctx.beginPath(); ctx.moveTo(x(t), y - 4); ctx.lineTo(x(t), y + 4); ctx.stroke();
    ctx.globalAlpha = a * 0.85; ctx.fillStyle = "#d4def5";
    ctx.fillText(t === 20 ? "20 g" : `${t}`, x(t), y + 8);
  }
  // Pinned names above the swarm, joined to their bird by a hairline.
  d.pins.forEach((code, i) => {
    const s = S.byCode[code], g = s.g;
    if (!S.active.has(code) || g.a < 0.3) return;
    const ly = d.top - 26 - (i % 3) * 26;
    ctx.globalAlpha = a * 0.4; ctx.strokeStyle = "#fff";
    ctx.beginPath(); ctx.moveTo(g.sx, g.sy - g.r - 2); ctx.lineTo(g.sx, ly + 11); ctx.stroke();
    pill(`${nameOf(s)} · ${s.mass} g`, g.sx, ly, { alpha: a });
  });
  ctx.globalAlpha = 1;
}

function drawSizeAxisTall(a) {
  const d = S.deco, y = d.y, x = d.axisX;
  ctx.globalAlpha = a * 0.5;
  ctx.strokeStyle = "#d4def5"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y.range()[0]); ctx.lineTo(x, y.range()[1]); ctx.stroke();
  ctx.font = "13px 'IBM Plex Sans', sans-serif"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
  for (const t of [2, 3, 4, 5, 6, 8, 10, 15, 20]) {
    ctx.globalAlpha = a * 0.5;
    ctx.beginPath(); ctx.moveTo(x - 4, y(t)); ctx.lineTo(x + 4, y(t)); ctx.stroke();
    ctx.globalAlpha = a * 0.85; ctx.fillStyle = "#d4def5";
    ctx.fillText(t === 20 ? "20 g" : `${t}`, x - 8, y(t));
  }
  // Pinned names sit to the right, joined to their bird by a hairline; close ones are nudged apart.
  let prev = -Infinity;
  const rows = d.pins.map((code) => S.byCode[code]).filter((s) => S.active.has(s.code) && s.g.a >= 0.3)
    .sort((p, q) => q.g.sy - p.g.sy)
    .map((s) => { const ly = Math.min(s.g.sy, prev === -Infinity ? s.g.sy : prev - 26); prev = ly; return { s, ly }; });
  ctx.font = "500 13px 'IBM Plex Sans', sans-serif";
  for (const { s, ly } of rows) {
    const text = `${nameOf(s)} · ${s.mass} g`, w = ctx.measureText(text).width;
    const lx = W - 10 - w / 2 - 7;
    ctx.globalAlpha = a * 0.4; ctx.strokeStyle = "#fff";
    ctx.beginPath(); ctx.moveTo(s.g.sx + s.g.r + 2, s.g.sy); ctx.lineTo(lx - w / 2 - 7, ly); ctx.stroke();
    pill(text, lx, ly, { alpha: a });
  }
  ctx.globalAlpha = 1;
}

function drawStatusScale(a) {
  const { groups, axisY: y } = S.deco;
  const real = groups.filter((g) => g.key !== "DD");
  // A colored scale bar under the columns, blending from safe to gone.
  const x0 = real[0].x0, x1 = real[real.length - 1].x0 + real[real.length - 1].w;
  const grad = ctx.createLinearGradient(x0, 0, x1, 0);
  real.forEach((g) => grad.addColorStop(clamp((g.x0 + g.w / 2 - x0) / (x1 - x0), 0, 1), g.c));
  ctx.globalAlpha = a * 0.9; ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(x0, y - 3, x1 - x0, 6, 3); ctx.fill();
  const dd = groups.find((g) => g.key === "DD");
  ctx.fillStyle = dd.c; ctx.globalAlpha = a * 0.5;
  ctx.beginPath(); ctx.roundRect(dd.x0, y - 3, dd.w, 6, 3); ctx.fill();
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  for (const g of groups) {
    const cx = g.x0 + g.w / 2;
    ctx.globalAlpha = a; ctx.fillStyle = g.c;
    ctx.font = "600 13px 'IBM Plex Sans', sans-serif";
    // Narrow columns (phones) show the Red List code instead of the full name; the hover tip spells it out.
    const name = g.w < 70 ? (g.key === "DD" ? "?" : g.key) : g.label || IUCN[g.key];
    const words = name.split(" "), lines = g.w < ctx.measureText(name).width + 6 && words.length > 1 ? [words.slice(0, -1).join(" "), words.at(-1)] : [name];
    lines.forEach((l, i) => ctx.fillText(l, cx, y + 10 + i * 16));
    // The count sits on top of each column.
    ctx.globalAlpha = a * 0.85; ctx.fillStyle = "#d4def5";
    ctx.font = "500 13px 'IBM Plex Sans', sans-serif"; ctx.textBaseline = "bottom";
    ctx.fillText(g.list.length ? `${g.list.length}` : tx("none", "ninguna"), cx, g.topY - 4);
    ctx.textBaseline = "top";
  }
  ctx.globalAlpha = 1;
}

function drawWanderPath() {
  const p = S.wander.path;
  if (p.length < 2) return;
  ctx.lineWidth = 1.5; ctx.lineCap = "round";
  for (let i = 1; i < p.length; i++) {
    const a = S.byCode[p[i - 1]].g, b = S.byCode[p[i]].g;
    ctx.globalAlpha = 0.15 + 0.6 * (i / (p.length - 1));
    ctx.strokeStyle = "#7fe0c4";
    const mx = (a.sx + b.sx) / 2 - (b.sy - a.sy) * 0.2, my = (a.sy + b.sy) / 2 + (b.sx - a.sx) * 0.2;
    ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.quadraticCurveTo(mx, my, b.sx, b.sy); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

let cardCanvas = null;
function drawCardBird(now) {
  if (!cardCanvas || !S.selected || !cardCanvas.isConnected) return;
  const s = S.byCode[S.selected];
  const c = cardCanvas.getContext("2d");
  const w = cardCanvas.clientWidth, h = cardCanvas.clientHeight;
  if (cardCanvas.width !== w * DPR) { cardCanvas.width = w * DPR; cardCanvas.height = h * DPR; }
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  const [c1, c2] = SUB[s.subfamily].c;
  const bg = c.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, c1 + "33"); bg.addColorStop(1, c2 + "22");
  c.clearRect(0, 0, w, h); c.fillStyle = bg; c.fillRect(0, 0, w, h);
  const r = 12 + Math.sqrt(massOf(s)) * 4;
  const bob = Math.sin(now * 0.003) * 3;
  drawBird(c, s, w / 2 - r * 0.6, h / 2 + bob, r, 1, -0.35 + Math.sin(now * 0.0015) * 0.06, 1, now);
}

/* ---------- Hit testing and pointer ---------- */

function birdAt(x, y) {
  let best = null, bd = Infinity, nearest = Infinity;
  for (const s of S.species) {
    const g = s.g;
    if (g.a < 0.3) continue;
    const d = Math.hypot(g.sx - x, g.sy - y);
    nearest = Math.min(nearest, d);
    if (d < Math.max(g.r * 1.3, 7) + 3 && d < bd) { best = s; bd = d; }
  }
  S.near = nearest < 70;
  return best;
}
function clusterAt(x, y) {
  if (S.deco?.kind !== "family") return null;
  let best = null;
  for (const c of S.deco.clusters) if (Math.hypot(c.x - x, c.y - y) <= c.r && (!best || c.r < best.r)) best = c;
  return best;
}
function countryAt(x, y) {
  if (S.view !== "world" || !M.proj) return null;
  const counts = countryCounts();
  for (const [iso, a] of Object.entries(M.anchors)) {
    if (!counts[iso] || M.byIso[iso]) continue;
    if (Math.hypot(a.x * M.t.k + M.t.x - x, a.y * M.t.k + M.t.y - y) < 9) return iso;
  }
  ctx.save();
  ctx.setTransform(M.t.k, 0, 0, M.t.k, M.t.x, M.t.y);
  let hit = null;
  for (const f of M.features) if (f.iso && counts[f.iso] && ctx.isPointInPath(f.p2d, x, y)) { hit = f.iso; break; }
  ctx.restore();
  return hit;
}

let countsCache = { key: null, val: {} };
function countryCounts() {
  const key = S.trail.filter((f) => f.type !== "country").map((f) => f.value).join("|");
  if (countsCache.key === key) return countsCache.val;
  const val = {};
  const base = S.species.filter((s) => S.trail.every((f) => f.type === "country" || matches(s, f)));
  for (const s of base) for (const d of s.dist) val[d.iso] = (val[d.iso] || 0) + 1;
  countsCache = { key, val };
  return val;
}

function showTip(html, e) {
  const tip = $("tip");
  tip.innerHTML = html;
  tip.hidden = false;
  tip.style.left = Math.min(e.clientX + 16, W - tip.offsetWidth - 8) + "px";
  tip.style.top = Math.min(e.clientY + 16, H - tip.offsetHeight - 8) + "px";
}

function bindUI() {
  document.querySelectorAll(".views button").forEach((b) => b.addEventListener("click", () => { stopWander(); setView(b.dataset.view); }));
  $("wander").addEventListener("click", () => (S.wander.on ? stopWander() : startWander()));

  cv.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    S.pointer = { clientX: e.clientX, clientY: e.clientY };
    hoverAt(S.pointer);
  });
  cv.addEventListener("pointerleave", () => { S.pointer = null; S.hover = null; S.hoverCluster = null; S.near = false; $("tip").hidden = true; });
  // Birds keep moving under a still pointer, so hover is re-checked a few times a second.
  setInterval(() => { if (S.pointer) hoverAt(S.pointer); }, 120);
  cv.addEventListener("click", (e) => {
    const s = birdAt(e.clientX, e.clientY);
    if (s) { stopWander(); select(s.code); return; }
    const c = clusterAt(e.clientX, e.clientY);
    if (c) { stopWander(); S.hoverCluster = null; $("tip").hidden = true; pushFilter(taxonFilter(c.level, c.value)); return; }
    const iso = countryAt(e.clientX, e.clientY);
    if (iso) { stopWander(); S.hoverCountry = null; pushFilter(countryFilterFor(iso)); return; }
    if (S.selected) { S.selected = null; renderPanel(); }
  });
  bindPanels();
}

function hoverAt(e) {
  const s = birdAt(e.clientX, e.clientY);
  S.hover = s ? s.code : null;
  S.hoverCluster = s ? null : clusterAt(e.clientX, e.clientY);
  S.hoverCountry = s ? null : countryAt(e.clientX, e.clientY);
  cv.style.cursor = s || S.hoverCluster || S.hoverCountry ? "pointer" : "default";
  if (s) {
    const cf = countryFilter();
    const st = cf && s.dist.find((d) => d.iso === cf.iso);
    const ph = photosFor(s).find((p) => !p.ml);
    showTip(`${ph ? `<img class="tip-img" src="${thumb(ph.src, 330)}" alt="" onerror="this.remove()">` : ""}<b>${esc(nameOf(s))}</b><em>${esc(s.sci)}</em><span>${s.mass ? `${s.mass} g · ` : ""}${tx("genus", "género")} ${esc(s.genus)}${st ? ` · ${esc(presenceName(st.st))} ${tx("in", "en")} ${esc(cf.label)}` : ""}</span>${S.view === "status" ? `<span>${esc(IUCN[s.iucn] || s.iucn)}${s.trend && s.trend !== "Unknown" ? tx(`, numbers ${esc(trendName(s.trend))}`, `, población ${esc(trendName(s.trend))}`) : ""}</span>` : ""}${s.endemic ? `<span class="tip-end">${tx(`Found only in ${esc(shortCountry(s.endemic))} · one of ${onlyIn(s.endemic).length} species found only there`, `Solo vive en ${esc(shortCountry(s.endemic))} · una de ${onlyIn(s.endemic).length} especies que solo viven ahí`)}</span>` : ""}`, e);
  } else if (S.hoverCluster) {
    const c = S.hoverCluster;
    const clade = cladeOf(c.level, c.value);
    showTip(`<small>${RANK[c.level]}</small><b class="sci">${esc(c.value)}</b>${clade ? `<em>${esc(clade)}</em>` : ""}<span>${tx(`${c.count} species · click to step inside`, `${c.count} especies · haz clic para entrar`)}</span>`, e);
  } else $("tip").hidden = true;
}

function bindPanels() {
  $("trail").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    stopWander(); popTo(+b.dataset.i);
  });
  $("countries").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-iso]"); if (!b) return;
    stopWander(); pushFilter(countryFilterFor(b.dataset.iso));
  });

  const panel = $("panel");
  panel.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act]"); if (!t) return;
    const act = t.dataset.act;
    if (act !== "photo" && act !== "zoom") stopWander();
    if (act === "close") { S.selected = null; renderPanel(); }
    else if (act === "bird") { S.peek = null; select(t.dataset.code); }
    else if (act === "pop") popTo(+t.dataset.i);
    else if (act === "photo") stepPhoto(+t.dataset.step);
    else if (act === "zoom") openLightbox();
    else if (act === "country") { pushFilter(countryFilterFor(t.dataset.iso)); if (S.view !== "world") setView("world"); }
    else if (act === "taxon") { pushFilter(taxonFilter(t.dataset.level, t.dataset.value)); if (t.dataset.view && S.view !== t.dataset.view) setView(t.dataset.view); }
  });
  panel.addEventListener("pointerover", (e) => { const c = e.target.closest("[data-code]"); S.peek = c ? c.dataset.code : null; });
  panel.addEventListener("pointerleave", () => { S.peek = null; });

  addEventListener("keydown", (e) => {
    // While the photo viewer or another dialog is open it handles its own keys (Esc closes only that).
    if (document.querySelector("dialog[open]")) return;
    if (e.key === "Escape") { stopWander(); S.selected = null; renderPanel(); }
    // Left/right arrows flip through a species' photos, unless the user is typing.
    if (S.selected && (e.key === "ArrowLeft" || e.key === "ArrowRight") && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) stepPhoto(e.key === "ArrowLeft" ? -1 : 1);
  });
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { resize(); relayout({ quick: true }); }, 120); });
}

function select(code) {
  const s = S.byCode[code];
  if (trimTrailFor(s)) { relayout(); renderTrail(); }
  S.selected = code;
  renderPanel();
}

/* ---------- Wander ---------- */

function startWander() {
  S.wander.on = true; S.wander.path = []; S.wander.note = null;
  $("wander").setAttribute("aria-pressed", "true");
  $("wander").querySelector("span").textContent = tx("Stop", "Detener");
  if (S.trail.length > 1) { S.trail = S.trail.slice(0, 1); relayout(); renderTrail(); }
  wanderStep();
}
function stopWander() {
  if (!S.wander.on) return;
  S.wander.on = false; clearTimeout(S.wander.timer);
  S.wander.path = []; S.wander.note = null;
  $("wander").setAttribute("aria-pressed", "false");
  $("wander").querySelector("span").textContent = tx("Wander", "Pasear");
  renderPanel();
}
function wanderStep() {
  if (!S.wander.on) return;
  const cur = S.selected ? S.byCode[S.selected] : null;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  if (!cur) {
    const s = pick(S.species.filter((s) => !s.extinct));
    S.wander.path = [s.code]; S.wander.note = tx(`Starting with the ${s.common}.`, `Empezamos con ${theEs(s)}.`);
    S.selected = s.code; renderPanel();
  } else {
    const recent = new Set(S.wander.path);
    const fresh = (list) => list.filter((s) => !recent.has(s.code));
    const opts = [];
    const rel = fresh(relatives(cur));
    if (rel.length) opts.push({ view: "family", list: rel, why: (t) => tx(`a close relative of the ${cur.common}: both are in ${t.genus === cur.genus ? `the genus ${cur.genus}` : groupName(cur)}.`,
                                                                                `son parientes cercanos: los dos están en ${t.genus === cur.genus ? `el género ${cur.genus}` : groupName(cur)}.`) });
    const homes = cur.dist.filter((d) => !isFaint(d.st));
    if (homes.length) {
      const d = pick(homes);
      const list = fresh(S.species.filter((s) => s !== cur && s.dist.some((x) => x.iso === d.iso && !isFaint(x.st))));
      if (list.length) opts.push({ view: "world", list, why: () => tx(`a neighbor of the ${cur.common}: both live in ${shortCountry(d.c)}.`, `son vecinos: los dos viven en ${shortCountry(d.c)}.`) });
    }
    const sz = fresh(similarSize(cur, 10));
    if (sz.length) opts.push({ view: "size", list: sz, why: (t) => tx(`about the same weight as the ${cur.common} (${t.mass} g and ${cur.mass} g).`, `pesan casi lo mismo (${t.mass} g y ${cur.mass} g).`) });
    const choices = opts.filter((o) => o.view !== S.wander.lastKind);
    const o = pick(choices.length ? choices : opts);
    if (o) {
      const t = pick(o.list);
      S.wander.lastKind = o.view;
      S.wander.note = tx(`The ${t.common} is ${o.why(t)}`, `${cap(theEs(t))} y ${theEs(cur)} ${o.why(t)}`);
      S.wander.path.push(t.code);
      if (S.wander.path.length > 7) S.wander.path.shift();
      S.selected = t.code;
      if (S.view !== o.view) setView(o.view); else renderPanel();
    }
  }
  S.wander.timer = setTimeout(wanderStep, 4200);
}

/* ---------- Relationships ---------- */

function groupName(s) { return s.tribe !== "—" ? tx(`the tribe ${s.tribe} (${TRIBE[s.tribe]})`, `la tribu ${s.tribe} (${TRIBE[s.tribe]})`) : tx(`the subfamily ${s.subfamily} (${SUB[s.subfamily].clade})`, `la subfamilia ${s.subfamily} (${SUB[s.subfamily].clade})`); }
function relatives(s) {
  let list = S.species.filter((x) => x !== s && x.genus === s.genus);
  if (!list.length) list = S.species.filter((x) => x !== s && (s.tribe !== "—" ? x.tribe === s.tribe : x.subfamily === s.subfamily));
  return list.sort((a, b) => Math.abs(a.seq - s.seq) - Math.abs(b.seq - s.seq)).slice(0, 10);
}
function similarSize(s, n = 6) {
  if (!s.mass) return [];
  return S.species.filter((x) => x !== s && x.mass)
    .sort((a, b) => Math.abs(Math.log(a.mass / s.mass)) - Math.abs(Math.log(b.mass / s.mass))).slice(0, n);
}
function onlyIn(name) { return S.species.filter((x) => x.endemic === name); }

/* ---------- DOM: trail, panel, country strip ---------- */

function renderTrail() {
  $("trail").innerHTML = S.trail.map((f, i) => {
    const rank = f.type === "taxon" ? `<small>${RANK[f.level]}</small> ` : "";
    const name = f.type === "taxon" ? `<span class="sci">${esc(f.label)}</span>` : esc(f.label);
    return `<li><button data-i="${i}">${rank}${name}</button></li>`;
  }).join("");
}

function renderCountries() {
  const el = $("countries");
  if (S.view !== "world") { el.hidden = true; return; }
  el.hidden = false;
  const counts = countryCounts();
  const cf = countryFilter();
  const names = {};
  for (const s of S.species) for (const d of s.dist) names[d.iso] = shortCountry(d.c);
  el.innerHTML = Object.entries(counts).sort((a, b) => b[1] - a[1])
    .map(([iso, n]) => `<button data-iso="${iso}" ${cf && cf.iso === iso ? 'class="on"' : ""}>${esc(names[iso])}<b>${n}</b></button>`).join("");
}

function dot(s, cls = "") { const [a, b] = SUB[s.subfamily].c; return `<i class="${cls}" style="background:linear-gradient(135deg,${a},${b})"></i>`; }
// Chips mark endemic species ("only in Peru") unless every chip in the list is endemic to the same place.
function birdChips(list, extra) {
  if (!list.length) return "";
  const sameEndemic = list.every((s) => s.endemic && s.endemic === list[0].endemic);
  const tag = (s) => (extra ? extra(s) : !sameEndemic && s.endemic ? `${tx("only in", "solo en")} ${esc(shortCountry(s.endemic))}` : "");
  return `<div class="chips">${list.map((s) => `<button class="chip" data-act="bird" data-code="${s.code}">${dot(s)}${esc(nameOf(s))}${tag(s) ? ` <small>${tag(s)}</small>` : ""}</button>`).join("")}</div>`;
}
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// The rank ladder: Family → Subfamily → Tribe → Genus → Species, filled in as far as the trail goes.
function ladderHTML(active) {
  const idx = (level) => S.trail.findIndex((f) => f.type === "taxon" && f.level === level);
  const tf = deepestTaxon();
  const sf = tf ? active[0]?.subfamily : null;
  const tr = tf && (tf.level === "tribe" || tf.level === "genus") ? active[0]?.tribe : null;
  const gn = tf?.level === "genus" ? tf.value : null;
  const nSub = new Set(active.map((s) => s.subfamily)).size;
  const nTribe = new Set(active.filter((s) => s.tribe !== "—").map((s) => s.tribe)).size;
  const nGen = new Set(active.map((s) => s.genus)).size;

  const row = (rank, here, body, i) => `<li class="${here ? "here" : ""}"><span class="rank">${rank}</span>${
    i != null && i >= 0 ? `<button data-act="pop" data-i="${i}">${body}</button>` : `<span class="val">${body}</span>`}</li>`;
  const named = (v, clade) => `<b class="sci">${esc(v)}</b>${clade ? `<em>${esc(clade)}</em>` : ""}`;
  const pending = (t) => `<span class="pending">${t}</span>`;

  let tribeRow;
  const T = RANK.tribe;
  if (tr && tr !== "—") tribeRow = row(T, tf.level === "tribe", named(tr, TRIBE[tr]), idx("tribe"));
  else if (sf && (tf.level !== "subfamily" || nTribe === 0)) tribeRow = row(T, false, pending(tx(`none: ${esc(sf)} isn't split into tribes`, `ninguna: ${esc(sf)} no se divide en tribus`)));
  else tribeRow = row(T, false, pending(nTribe ? tx(`${plural(nTribe, "tribe", "tribes")}, the dashed circles`, `${plural(nTribe, "tribu", "tribus")}, los círculos punteados`) : tx("none", "ninguna")));

  return `<ol class="ladder">
    ${row(tx("Family", "Familia"), !tf, named("Trochilidae", tx("hummingbirds", "colibríes")), 0)}
    ${sf ? row(RANK.subfamily, tf.level === "subfamily", named(sf, SUB[sf].clade), idx("subfamily")) : row(RANK.subfamily, false, pending(tx(`${plural(nSub, "subfamily", "subfamilies")}, the big tinted circles`, `${plural(nSub, "subfamilia", "subfamilias")}, los círculos grandes de color`)))}
    ${tribeRow}
    ${gn ? row(RANK.genus, true, named(gn, cladeOf("genus", gn)), idx("genus")) : row(RANK.genus, false, pending(tx(`${plural(nGen, "genus", "genera")}, the small circles`, `${plural(nGen, "género", "géneros")}, los círculos pequeños`)))}
    ${row(tx("Species", "Especie"), false, pending(tx(`${plural(active.length, "species", "species")}, each bird`, `${plural(active.length, "especie", "especies")}, cada ave`)))}
  </ol>`;
}

// Facts every group can have, computed from the data, plus the written note where there is one.
function sharedHTML(level, value, list) {
  const all = S.species;
  const range = (arr, k) => { const v = arr.map((s) => s[k]).filter(Boolean); return v.length ? [d3.min(v), d3.max(v)] : null; };
  const fmt = ([a, b], u) => (a === b ? `${a} ${u}` : `${a}–${b} ${u}`);
  const wt = range(list, "mass"), allWt = range(all, "mass");
  const bill = range(list, "bill"), allBill = range(all, "bill");
  const hab = d3.rollups(list.filter((s) => s.habitat), (v) => v.length, (s) => s.habitat).sort((a, b) => b[1] - a[1])[0];
  const ctry = d3.rollups(list.flatMap((s) => s.dist.filter((d) => !isFaint(d.st))), (v) => v.length, (d) => d.c).sort((a, b) => b[1] - a[1]);
  const threatened = list.filter((s) => ["VU", "EN", "CR"].includes(s.iucn)).length;
  const items = [];
  if (ES) {
    if (wt) items.push(`Pesan ${fmt(wt, "g")} <small>(todos los colibríes: ${fmt(allWt, "g")})</small>`);
    if (bill) items.push(`Pico de ${fmt(bill.map(Math.round), "mm")} <small>(todos: ${fmt(allBill.map(Math.round), "mm")})</small>`);
    if (hab) items.push(`${hab[1] === list.length ? "Todos viven" : `${hab[1]} de ${list.length} viven`} sobre todo en ${esc(habitatName(hab[0]).toLowerCase())}`);
    if (ctry.length) items.push(`Viven en ${plural(ctry.length, "país", "países")}${list.length > 1 ? `; donde hay más especies es ${esc(shortCountry(ctry[0][0]))} (${ctry[0][1]})` : ""}`);
    if (threatened) items.push(`${threatened} ${threatened === 1 ? "está amenazada" : "están amenazadas"} (Vulnerable o peor)`);
  } else {
    if (wt) items.push(`Weigh ${fmt(wt, "g")} <small>(all hummingbirds: ${fmt(allWt, "g")})</small>`);
    if (bill) items.push(`Bills ${fmt(bill.map(Math.round), "mm")} long <small>(all: ${fmt(allBill.map(Math.round), "mm")})</small>`);
    if (hab) items.push(`${hab[1] === list.length ? "All" : `${hab[1]} of ${list.length}`} live mainly in ${esc(hab[0].toLowerCase())}`);
    if (ctry.length) items.push(`Live in ${plural(ctry.length, "country", "countries")}${list.length > 1 ? `; the most species are in ${esc(shortCountry(ctry[0][0]))} (${ctry[0][1]})` : ""}`);
    if (threatened) items.push(`${threatened} ${threatened === 1 ? "is" : "are"} threatened (Vulnerable or worse)`);
  }
  // Spanish: the approved subfamily and tribe notes only; genus notes are still English drafts under review.
  const note = ES ? ES_DATA.notes[level]?.[value] : NOTES[level]?.[value];
  return `<h3>${tx("What they share", "Lo que tienen en común")}</h3>${note ? `<p class="note">${esc(note)}</p>` : ""}<ul class="shared">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
}

function renderPanel() {
  const p = $("panel");
  // Keep the address bar pointing at the open card, so it can be shared.
  const url = new URL(location.href);
  if (S.selected) url.searchParams.set("species", S.selected); else url.searchParams.delete("species");
  if (url.href !== location.href) history.replaceState(null, "", url);
  // The language switch opens the same card in the other language (the Spanish page's <base> is the site root).
  const lang = $("langBtn");
  if (lang) lang.href = (ES ? "./" : "es/") + (S.selected ? `?species=${S.selected}` : "");
  p.classList.toggle("open", !!S.selected);
  cardCanvas = null;
  if (S.selected) { p.innerHTML = cardHTML(S.byCode[S.selected]); cardCanvas = p.querySelector(".swatch canvas"); return; }

  const active = S.species.filter((s) => S.active.has(s.code));
  const cf = countryFilter();
  const tf = deepestTaxon();
  let html = "";
  if (tf) {
    html += `<div class="kicker">${RANK[tf.level]}</div><h2 class="sci">${esc(tf.value)}</h2>`;
    const clade = cladeOf(tf.level, tf.value);
    if (clade) html += `<p class="lede">${tf.level === "genus" ? tx("Called ", "Llamados ") : ""}${esc(clade)}</p>`;
    if (cf) html += `<p class="lede">${tx(`${active.length} of them in`, `${active.length} de ellos en`)} ${esc(cf.label)}</p>`;
  } else if (cf) {
    html += `<h2>${esc(cf.label)}</h2><p class="lede">${tx(plural(active.length, "hummingbird species", "hummingbird species"), plural(active.length, "especie de colibrí", "especies de colibrí"))}</p>`;
  } else {
    html += ES
      ? `<h2>${active.length} colibríes</h2><p class="lede">Todas las especies de colibrí pertenecen a una familia, Trochilidae. Los biólogos ordenan la familia en grupos, uno dentro de otro, de los más amplios a los más pequeños:</p><p class="lede"><a href="es/especies/">Lista de las ${active.length} especies</a>, cada una con su propia página.</p>`
      : `<h2>${active.length} hummingbirds</h2><p class="lede">Every hummingbird species belongs to one family, Trochilidae. Biologists sort the family into nested groups, from broad to narrow:</p><p class="lede"><a href="species/">List of all ${active.length} species</a>, each with its own page.</p>`;
  }
  if (cf) {
    const res = active.filter((s) => !isFaint(s.dist.find((d) => d.iso === cf.iso).st)).length;
    if (res < active.length) html += `<p class="lede">${tx(`${res} live here; ${active.length - res} are rare visitors or uncertain (shown faded).`, `${res} viven aquí; ${active.length - res} son visitantes raros o inciertos (se ven más tenues).`)}</p>`;
  }

  html += `<h3>${tx("How the family is organized", "Cómo se organiza la familia")}</h3>${ladderHTML(active)}`;
  if (tf) html += sharedHTML(tf.level, tf.value, active);

  // List the next level down from wherever the trail has narrowed to.
  let level = "subfamily";
  if (tf?.level === "subfamily") level = active.some((s) => s.tribe !== "—") ? "tribe" : "genus";
  else if (tf?.level === "tribe") level = "genus";
  if (tf?.level === "genus") {
    html += `<h3>${tx("Its species", "Sus especies")}</h3>${birdChips(active)}`;
  } else {
    const groups = d3.groups(active, (s) => s[level]).sort((a, b) => a[1][0].seq - b[1][0].seq);
    html += `<h3>${(ES ? { subfamily: "Subfamilias", tribe: "Tribus", genus: "Géneros" } : { subfamily: "Subfamilies", tribe: "Tribes", genus: "Genera" })[level]}${tx(" here", " aquí")}</h3><div class="legend">${groups.map(([v, list]) =>
      `<button data-act="taxon" data-level="${level}" data-value="${esc(v)}">${dot(list[0], "lg")}<span><b class="sci">${esc(v)}</b><em>${esc(cladeOf(level, v))}</em></span><small>${list.length}</small></button>`).join("")}</div>`;
  }

  if (cf) {
    const only = onlyIn(cf.name).filter((s) => S.active.has(s.code));
    html += `<h3>${tx("Found only in", "Solo viven en")} ${esc(cf.label)}${only.length ? tx(` (${only.length} species)`, ` (${only.length} especies)`) : ""}</h3>` + (only.length ? birdChips(only) : `<p class="empty">${tx(`No hummingbird here is found only in ${esc(cf.label)}.`, `Ningún colibrí de aquí vive solo en ${esc(cf.label)}.`)}</p>`);
  }
  p.innerHTML = html;
}

// Every photo for a species: Lia's own first, then Commons picks, then any Macaulay embeds.
function photosFor(s) {
  const ml = (S.mlPhotos[s.code] || []).map((id) => ({ ml: String(id), page: `https://macaulaylibrary.org/asset/${encodeURIComponent(id)}` }));
  return [...(S.ownPhotos[s.code] || []), ...[].concat(S.photos[s.code] || []), ...ml];
}

// An image, or for Macaulay photos their embed (which carries its own credit line).
function mediaHTML(ph, name) {
  if (ph.ml) return `<iframe src="${esc(ph.page)}/embed" title="${esc(name)}, ${tx("photo from the Macaulay Library", "foto de la Macaulay Library")}" loading="lazy" allowfullscreen></iframe>`;
  return `<img src="${esc(ph.src)}" alt="${esc(name)}" data-act="zoom" title="${tx("View larger", "Ver más grande")}">`;
}

function creditHTML(ph) {
  if (ph.ml) return tx(`Photo from the <a href="${esc(ph.page)}" target="_blank" rel="noopener">Macaulay Library (ML${esc(ph.ml)})</a>; photographer credited in the photo`,
                       `Foto de la <a href="${esc(ph.page)}" target="_blank" rel="noopener">Macaulay Library (ML${esc(ph.ml)})</a>; el crédito del fotógrafo aparece en la foto`);
  const lic = ph.licenseUrl ? `<a href="${esc(ph.licenseUrl)}" target="_blank" rel="noopener">${esc(ph.license)}</a>` : esc(ph.license);
  const src = ph.page ? ` · <a href="${esc(ph.page)}" target="_blank" rel="noopener">${esc(ph.site || "Wikimedia Commons")}</a>` : "";
  return `${tx("Photo", "Foto")}: ${esc(ph.artist)} · ${ES && ph.license === "All rights reserved" ? "Todos los derechos reservados" : lic}${src}`;
}

// The species' photos as a small carousel (arrows only when there's more than one),
// or the animated shape when there's no free photo.
function photoHTML(s) {
  const list = photosFor(s);
  if (!list.length) return `<div class="swatch"><canvas></canvas><span class="photo-note">${tx("No free photo yet", "Todavía no hay foto libre")}</span></div>`;
  const nav = list.length > 1 ? `
    <button class="pnav prev" data-act="photo" data-step="-1" aria-label="${tx("Previous photo", "Foto anterior")}">‹</button>
    <button class="pnav next" data-act="photo" data-step="1" aria-label="${tx("Next photo", "Foto siguiente")}">›</button>
    <span class="pcount">1 / ${list.length}</span>` : "";
  // The frame takes the shape of the tallest photo (within limits), so photos fill it instead of sitting between bars.
  const shapes = list.filter((p) => p.w && p.h).map((p) => p.w / p.h);
  const ratio = shapes.length ? clamp(Math.min(...shapes), 0.8, 1.6) : 4 / 3;
  return `<figure class="photo" data-i="0"><div class="pframe${list[0].ml ? " ml" : ""}" style="aspect-ratio:${ratio.toFixed(3)}"><div class="pmedia">${mediaHTML(list[0], nameOf(s))}</div>
    <button class="pzoom" data-act="zoom" aria-label="${tx("View larger", "Ver más grande")}" title="${tx("View larger", "Ver más grande")}">⤢</button>${nav}</div>
    <figcaption>${creditHTML(list[0])}</figcaption></figure>`;
}

// Full-screen view of the card's current photo. Commons photos load at 1920 px; own photos at full size.
const bigSrc = (ph) => ph.big || (/^https?:/.test(ph.src) ? thumb(ph.src, 1920) : ph.src);

function openLightbox() {
  const fig = $("panel").querySelector(".photo");
  const s = S.byCode[S.selected];
  const list = photosFor(s), i = fig ? +fig.dataset.i : 0;
  // Macaulay's embed doesn't load reliably at full screen (its bot check stalls), so open its own page instead.
  if (list[i]?.ml) { window.open(list[i].page, "_blank", "noopener"); return; }
  // The viewer steps through regular photos only; Macaulay ones stay on the card.
  const shown = list.filter((p) => !p.ml);
  S.lb = { list: shown, i: shown.indexOf(list[i]), name: nameOf(s), all: list };
  renderLightbox();
  $("lightbox").showModal();
}
function renderLightbox() {
  const { list, i, name } = S.lb, ph = list[i];
  const img = $("lbImg"), frame = $("lbFrame");
  img.hidden = !!ph.ml;
  frame.hidden = !ph.ml;
  if (ph.ml) { frame.src = `${ph.page}/embed`; frame.title = `${name}, ${tx("photo from the Macaulay Library", "foto de la Macaulay Library")}`; }
  else frame.removeAttribute("src");
  if (!ph.ml) img.src = bigSrc(ph);
  img.onerror = () => { img.onerror = null; img.src = ph.src; };
  img.alt = name;
  $("lbCap").innerHTML = `<b>${esc(name)}</b>${list.length > 1 ? ` · ${i + 1} / ${list.length}` : ""}<br>${creditHTML(ph)}`;
  $("lightbox").classList.toggle("single", list.length < 2);
}
function stepLightbox(step) {
  const n = S.lb.list.length;
  if (n < 2) return;
  S.lb.i = (S.lb.i + step + n) % n;
  renderLightbox();
  // Keep the card's carousel on the same photo, so closing lands where you were.
  const fig = $("panel").querySelector(".photo");
  if (fig) stepPhoto(S.lb.all.indexOf(S.lb.list[S.lb.i]) - +fig.dataset.i);
}

function stepPhoto(step) {
  const fig = $("panel").querySelector(".photo");
  const list = photosFor(S.byCode[S.selected]);
  if (!fig || list.length < 2) return;
  const i = (+fig.dataset.i + step + list.length) % list.length;
  fig.dataset.i = i;
  fig.querySelector(".pmedia").innerHTML = mediaHTML(list[i], nameOf(S.byCode[S.selected]));
  fig.querySelector(".pframe").classList.toggle("ml", !!list[i].ml);
  fig.querySelector(".pcount").textContent = `${i + 1} / ${list.length}`;
  fig.querySelector("figcaption").innerHTML = creditHTML(list[i]);
}

function cardHTML(s) {
  const clips = s.mass ? Math.max(1, Math.round(s.mass)) : 0;
  const cf = countryFilter();
  const only = s.endemic ? onlyIn(s.endemic).filter((x) => x !== s) : [];
  const order = (d) => (isFaint(d.st) ? 1 : 0);
  const dist = [...s.dist].sort((a, b) => order(a) - order(b) || (b.n || 0) - (a.n || 0));
  const rel = relatives(s);
  const relTitle = rel.length && rel[0].genus === s.genus ? tx(`Others in the genus <i>${esc(s.genus)}</i>`, `Otros del género <i>${esc(s.genus)}</i>`) : tx(`Nearest relatives, in ${esc(groupName(s))}`, `Parientes más cercanos, en ${esc(groupName(s))}`);
  const genusNote = ES ? null : NOTES.genus[s.genus];
  const placeRow = (level, value, clade) =>
    `<button class="place" data-act="taxon" data-level="${level}" data-value="${esc(value)}" data-view="family"><span class="rank">${RANK[level]}</span><b class="sci">${esc(value)}</b>${clade ? `<em>${esc(clade)}</em>` : ""}</button>`;

  return `
  <div class="hero"><button class="close" data-act="close" aria-label="${tx("Close", "Cerrar")}">×</button>${photoHTML(s)}</div>
  ${S.wander.on && S.wander.note ? `<p class="wandernote">${esc(S.wander.note)}</p>` : ""}
  <h2>${esc(nameOf(s))}</h2>
  <div class="sci big">${esc(s.sci)}</div>
  <div class="es">${ES ? "Inglés: " : ""}${esc(otherName(s))}${s.ioc_name ? ` · IOC: ${esc(s.ioc_name)}` : ""}</div>
  <p class="links">${s.endemic ? `<span class="endemic">${tx(`Endemic: found only in ${esc(shortCountry(s.endemic))}, one of ${onlyIn(s.endemic).length} species`, `Endémico: solo vive en ${esc(shortCountry(s.endemic))}, una de ${onlyIn(s.endemic).length} especies`)}</span>` : ""}<a class="ext" href="${pageOf(s)}">${tx("Species page", "Página de la especie")}</a><a class="ext" href="https://ebird.org/species/${encodeURIComponent(s.code)}${ES ? "?siteLanguage=es_MX" : ""}" target="_blank" rel="noopener">${tx("eBird page", "Página en eBird")} ↗</a></p>

  <h3>${tx("At a glance", "De un vistazo")}</h3>
  <dl class="facts">
    ${s.mass ? `<dt>${tx("Weight", "Peso")}</dt><dd>${s.mass} g, ${tx(`about ${clips} paperclip${clips > 1 ? "s" : ""}`, `más o menos ${clips} clip${clips > 1 ? "s" : ""}`)}</dd>` : ""}
    ${s.bill ? `<dt>${tx("Bill", "Pico")}</dt><dd>${s.bill} mm</dd>` : ""}
    ${s.habitat ? `<dt>${tx("Lives in", "Vive en")}</dt><dd>${esc(habitatName(s.habitat))}</dd>` : ""}
    ${s.migration ? `<dt>${tx("Moves", "Movimientos")}</dt><dd>${esc(MOVES[s.migration] || s.migration)}</dd>` : ""}
    <dt>${tx("Status", "Estado")}</dt><dd><span class="status" style="--st:${statusColor(s.iucn)}">${esc(IUCN[s.iucn] || s.iucn)}</span>${s.trend && s.trend !== "Unknown" ? `, ${esc(trendName(s.trend))}` : ""}</dd>
  </dl>

  <h3>${tx("Its place in the family", "Su lugar en la familia")}</h3>
  <div class="places">
    ${placeRow("subfamily", s.subfamily, SUB[s.subfamily].clade)}
    ${s.tribe !== "—" ? placeRow("tribe", s.tribe, TRIBE[s.tribe]) : ""}
    ${placeRow("genus", s.genus, cladeOf("genus", s.genus))}
  </div>
  ${genusNote ? `<p class="note"><b>What <i>${esc(s.genus)}</i> share:</b> ${esc(genusNote)}</p>` : ""}

  <h3>${tx("Where it lives", "Dónde vive")} · ${ES ? plural(s.dist.length, "país", "países") : plural(s.dist.length, "country", "countries")}</h3>
  <div class="chips">${dist.map((d) => `<button class="chip" data-act="country" data-iso="${d.iso}">${esc(shortCountry(d.c))}${order(d) ? ` <small>${esc(presenceName(d.st))}</small>` : ""}</button>`).join("")}</div>

  <h3>${relTitle}</h3>
  ${birdChips(rel) || `<p class="empty">${tx("None.", "Ninguno.")}</p>`}

  ${s.endemic ? `<h3>${tx("Other hummingbirds found only in", "Otros colibríes que solo viven en")} ${esc(shortCountry(s.endemic))}${only.length ? ` (${only.length})` : ""}</h3>${birdChips(only) || `<p class="empty">${tx(`It is the only hummingbird found only in ${esc(shortCountry(s.endemic))}.`, `Es el único colibrí que solo vive en ${esc(shortCountry(s.endemic))}.`)}</p>`}` : ""}

  `;
}

/* ---------- Search ---------- */

// Accent- and case-insensitive, so "colibri" finds "Colibrí".
const norm = (t) => (t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function searchIndex() {
  const groups = [];
  const seen = new Set();
  for (const s of S.species) {
    for (const level of ["subfamily", "tribe", "genus"]) {
      const v = s[level];
      if (v === "—" || seen.has(level + v)) continue;
      seen.add(level + v);
      const clade = cladeOf(level, v);
      groups.push({ level, value: v, clade, text: norm(`${v} ${clade}`), sample: s });
    }
  }
  const species = S.species.map((s) => ({ s, text: norm(`${s.common} ${s.sci} ${s.es} ${s.ioc_name || ""}`), name: norm(nameOf(s)) }));
  return { groups, species };
}

function runSearch(q, idx) {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const hit = (text) => terms.every((t) => text.includes(t));
  // Names that start with the query rank first.
  const rank = (name) => (name.startsWith(terms[0]) ? 0 : name.includes(" " + terms[0]) ? 1 : 2);
  const groups = idx.groups.filter((g) => hit(g.text)).sort((a, b) => rank(norm(a.value)) - rank(norm(b.value))).slice(0, 4);
  const species = idx.species.filter((x) => hit(x.text)).sort((a, b) => rank(a.name) - rank(b.name) || a.s.seq - b.s.seq).slice(0, 8);
  return [...groups.map((g) => ({ kind: "group", ...g })), ...species.map((x) => ({ kind: "species", s: x.s }))];
}

function bindSearch() {
  const input = $("q"), list = $("results");
  // The full hint only fits on wide screens; elsewhere it would be cut off mid-word.
  const roomy = matchMedia("(min-width: 1241px), (max-width: 800px)");
  const setHint = () => { input.placeholder = roomy.matches ? tx("Search species or groups", "Buscar especies o grupos") : tx("Search", "Buscar"); };
  setHint();
  roomy.addEventListener("change", setHint);
  let idx = null, items = [], cur = -1;
  const box = $("search"), btn = $("searchBtn");
  const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); cur = -1; };
  // On wider screens the box is hidden behind a magnifier button until it's needed.
  const openBox = () => { box.classList.add("open"); btn.setAttribute("aria-expanded", "true"); input.focus(); };
  const shut = () => { box.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", openBox);
  const render = () => {
    if (!items.length) {
      list.innerHTML = input.value.trim() ? `<li class="none">${tx("No matches", "Sin resultados")}</li>` : "";
      list.hidden = !input.value.trim();
      return;
    }
    list.innerHTML = items.map((it, i) => it.kind === "species"
      ? `<li role="option" id="r${i}" data-i="${i}" aria-selected="${i === cur}">${dot(it.s)}<span><b>${esc(nameOf(it.s))}</b><em>${esc(it.s.sci)}</em></span></li>`
      : `<li role="option" id="r${i}" data-i="${i}" aria-selected="${i === cur}">${dot(it.sample)}<span><small>${RANK[it.level]}</small><b class="sci">${esc(it.value)}</b>${it.clade ? `<em>${esc(it.clade)}</em>` : ""}</span></li>`).join("");
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    if (cur >= 0) input.setAttribute("aria-activedescendant", `r${cur}`);
  };
  const choose = (it) => {
    stopWander();
    close(); input.value = ""; input.blur(); shut();
    if (it.kind === "species") select(it.s.code);
    else { pushFilter(taxonFilter(it.level, it.value)); if (S.view !== "family") setView("family"); }
  };
  input.addEventListener("input", () => { idx ||= searchIndex(); items = runSearch(input.value, idx); cur = items.length ? 0 : -1; render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" && items.length) { cur = (cur + 1) % items.length; render(); e.preventDefault(); }
    else if (e.key === "ArrowUp" && items.length) { cur = (cur - 1 + items.length) % items.length; render(); e.preventDefault(); }
    else if (e.key === "Enter" && cur >= 0) choose(items[cur]);
    else if (e.key === "Escape") { close(); input.value = ""; input.blur(); shut(); e.stopPropagation(); }
  });
  list.addEventListener("pointerdown", (e) => { const li = e.target.closest("li[data-i]"); if (li) { e.preventDefault(); choose(items[+li.dataset.i]); } });
  input.addEventListener("blur", () => setTimeout(() => { close(); if (!input.value.trim()) shut(); }, 100));
  input.addEventListener("focus", () => { if (items.length) render(); });
  // "/" jumps to search, as on many sites.
  addEventListener("keydown", (e) => { if (e.key === "/" && document.activeElement !== input) { e.preventDefault(); openBox(); } });
}

function bindLightbox() {
  const lb = $("lightbox");
  $("lbClose").addEventListener("click", () => lb.close());
  lb.querySelectorAll(".lb-nav").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); stepLightbox(+b.dataset.step); }));
  // A click anywhere outside the photo itself closes the viewer.
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.tagName === "FIGURE") lb.close(); });
  lb.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); stepLightbox(e.key === "ArrowLeft" ? -1 : 1); }
  });
}

function bindCredits() {
  const dlg = $("credits");
  $("creditsBtn").addEventListener("click", () => dlg.showModal());
  $("creditsClose").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
}
