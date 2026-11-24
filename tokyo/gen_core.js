/* gen_core.js — TOKYO procedural building generator core. NO DOM, NO dependencies.
 * UMD: browser classic script sets globalThis.GEN; Node (CJS) gets module.exports,
 * so `import GEN from './gen_core.js'` works from an .mjs test.
 *
 * Typologies grounded in real Tokyo architecture:
 *  O1 Pencil (ペンシルビル) — skinny lot tower, external evacuation stair, vertical tenant signage.
 *  O2 Setback (斜線ビル) — sky-exposure-plane stepped wedge.
 *  O3 Grid (都庁風) — granite+glass vertical stripe grid, optional twin towers.
 *  O4 Cocoon (コクーン) — bulging tapered massing wrapped in a diagrid.
 *  O5 Capsule (中銀カプセル) — concrete cores + plug-in capsules with round windows.
 *  R1 Mansion (マンション) — continuous balconies partitioned by party walls, AC, tile.
 *  R2 Apaato (アパート) — 2F wood/light-steel, external stair, open corridor, gable.
 *  R3 Tower mansion (タワーマンション) — balcony-grid tower on a podium.
 *
 * Ordinary (non-landmark) typologies, each with the full knob set:
 *  O6–O10 everyday offices (standard / tenant / glass box / low-rise / ribbon).
 *  HO1 City hotel (banded guestroom tower + rooftop sign frame), HO2 Business hotel
 *      (narrow slab, dense room grid, external stair, projecting lift shaft).
 *  DP1 Department store (2F glass base, horizontal canopies, rooftop sign frame),
 *      DP2 Shopping centre (wide low box, long canopy, rooftop parking deck, pylon sign).
 *  HP1 General hospital (long slab, ribbon wards, louvered equipment floor, helipad),
 *      HP2 Ward block (low ward wing + tall clinical tower, helipad on the ward roof).
 *  DC1 Danchi slab (long board, open corridor colonnade, end stair towers + bulkheads),
 *      DC2 Public housing (two stepped wings, central stair core, roof terrace).
 *
 * Knobs on every type: floors, widthFactor, floorHeight (2.8–4.6 m), palette,
 * ac, acUnits, billboard, mechanical, rooftopClutter, antenna, balconies, lobby,
 * neon, verticalSign (+ crown / garden / density / tileFacade / helipad).
 *
 * Axes: x = width, y = depth (front = +y), z = up. Flat voxel index z*W*D + y*W + x.
 * Shading follows tokyo/kit.py: occupancy-gradient normals, separable [1,2,1] smoothing,
 * light (0.45,0.5,0.8) normalized, 4 quantized levels into hue-shifted ramps.
 * Rendering follows skills/sprite-stacking: spacing=1, symmetric centres (w-1)*0.5,
 * nearest sampling, squash pitch, outline the finished stack once.
 */
(function (root, factory) {
  const GEN = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = GEN;
  if (root) root.GEN = GEN;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
"use strict";

// ---------------------------------------------------------------- RNG
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const chance = (rng, p) => rng() < p;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------- ramps (kit.py)
const R = {
  concrete: [[96,96,100],[130,130,134],[168,168,170],[204,204,204]],
  white:    [[150,152,156],[188,190,194],[222,224,226],[248,250,250]],
  glass:    [[38,56,78],[62,88,116],[96,132,164],[150,192,220]],
  curtain:  [[30,44,62],[48,68,92],[74,102,132],[116,150,180]],
  glassW:   [[70,96,120],[104,138,168],[150,188,214],[206,232,248]],
  cream:    [[150,138,110],[186,172,140],[220,206,172],[246,236,208]],
  brick:    [[96,52,40],[130,72,54],[166,96,72],[200,124,96]],
  roof:     [[34,40,54],[52,60,78],[76,86,108],[104,116,140]],
  roofM:    [[60,64,70],[88,94,102],[120,128,138],[156,164,174]],
  metal:    [[70,74,82],[100,106,116],[134,142,152],[172,180,190]],
  alu:      [[110,116,124],[146,152,162],[184,192,202],[220,228,236]],
  steelD:   [[40,44,50],[60,66,74],[84,92,102],[112,120,132]],
  green:    [[40,70,38],[60,100,52],[88,138,72],[124,176,100]],
  wood:     [[86,60,36],[120,86,50],[156,116,70],[192,150,96]],
  asphalt:  [[34,36,40],[48,50,56],[64,66,72],[82,84,90]],
  black:    [[20,22,26],[34,36,42],[50,54,62],[70,74,84]],
  tan:      [[128,104,74],[164,136,98],[200,170,126],[232,206,160]],
  beige:    [[140,124,96],[176,158,126],[210,194,160],[238,226,196]],
  mint:     [[96,128,110],[128,164,140],[164,200,172],[204,236,208]],
  bronze:   [[70,52,36],[104,78,50],[142,108,68],[186,146,96]],
  bronzeGl: [[56,48,40],[88,74,56],[124,104,76],[168,144,108]],
  greenGl:  [[34,64,52],[52,96,74],[80,138,104],[124,184,144]],
  teal:     [[30,60,64],[46,90,96],[70,126,132],[108,168,174]],
  granite:  [[88,90,96],[120,122,128],[154,156,162],[190,192,198]],
  nred:     [[180,40,40],[220,60,56],[250,92,80],[255,150,130]],
  nblue:    [[40,80,180],[60,120,224],[96,160,250],[160,206,255]],
  nyel:     [[180,150,30],[224,196,50],[250,228,92],[255,248,170]],
  ngreen:   [[30,150,70],[50,196,100],[92,230,140],[160,250,196]],
  npink:    [[180,50,120],[224,80,160],[250,120,196],[255,180,226]],
  sign:     [[180,184,190],[214,218,224],[240,244,248],[255,255,255]],
};

// ---------------------------------------------------------------- materials
const MAT = {
  EMPTY:0, BODY:1, GLASS:2, FRAME:3, ACCENT:4, CONCRETE:5, METAL:6, ALU:7,
  STEEL:8, ROOF:9, GREEN:10, WHITE:11, BLACK:12, GLASS_W:13, SIGN:14,
  WOOD:15, ASPHALT:16, NRED:17, NBLUE:18, NYEL:19, NGREEN:20, NPINK:21,
};
const EMISSIVE = new Set([MAT.ACCENT, MAT.SIGN, MAT.NRED, MAT.NBLUE, MAT.NYEL, MAT.NGREEN, MAT.NPINK]);
const NEONS = [MAT.NRED, MAT.NBLUE, MAT.NYEL, MAT.NGREEN, MAT.NPINK];

const PALETTES = {
  office: {
    white:   { name:"White tile 白タイル",   body:R.white,   glass:R.glassW,  frame:R.alu,    accent:R.nblue },
    granite: { name:"Granite 御影石",        body:R.granite, glass:R.glass,   frame:R.metal,  accent:R.nred },
    glass:   { name:"Blue-green ガラス",     body:R.teal,    glass:R.greenGl, frame:R.alu,    accent:R.ngreen },
    alu:     { name:"Aluminum アルミ",       body:R.alu,     glass:R.glass,   frame:R.metal,  accent:R.nyel },
    bronze:  { name:"Bronze 銅",             body:R.bronze,  glass:R.bronzeGl,frame:R.steelD, accent:R.nyel },
    beige:   { name:"Beige tile ベージュ",   body:R.beige,   glass:R.glass,   frame:R.white,  accent:R.nyel },
    sage:    { name:"Green glass 緑ガラス",  body:R.teal,    glass:R.greenGl, frame:R.alu,    accent:R.ngreen },
  },
  residential: {
    cream: { name:"Cream tile クリーム", body:R.cream, glass:R.glass,  frame:R.white, accent:R.nyel },
    white: { name:"White tile 白",       body:R.white, glass:R.glassW, frame:R.alu,   accent:R.nblue },
    beige: { name:"Beige ベージュ",      body:R.beige, glass:R.glass,  frame:R.cream, accent:R.npink },
    brick: { name:"Brick 赤レンガ",      body:R.brick, glass:R.glass,  frame:R.white, accent:R.nred },
    gray:  { name:"Gray グレー",         body:R.concrete, glass:R.glass, frame:R.metal, accent:R.ngreen },
    mint:  { name:"Mint ミント",         body:R.mint,  glass:R.glassW, frame:R.white, accent:R.ngreen },
  },
  hotel: {
    city:   { name:"City bronze シティ",   body:R.bronze, glass:R.bronzeGl, frame:R.alu,   accent:R.nyel },
    modern: { name:"Modern white 白",      body:R.white,  glass:R.glass,    frame:R.metal, accent:R.nblue },
    warm:   { name:"Warm tan タン",        body:R.tan,    glass:R.glassW,   frame:R.cream, accent:R.nred },
  },
  department: {
    retro:  { name:"Retro brick レンガ",   body:R.brick,  glass:R.glassW, frame:R.cream, accent:R.nyel },
    cream:  { name:"Cream クリーム",       body:R.cream,  glass:R.glass,  frame:R.tan,   accent:R.nred },
    glassy: { name:"Glassy ガラス",        body:R.teal,   glass:R.greenGl,frame:R.alu,   accent:R.ngreen },
  },
  hospital: {
    white:   { name:"White 白",            body:R.white,  glass:R.glassW, frame:R.alu,   accent:R.ngreen },
    concrete:{ name:"Concrete コンクリ",   body:R.concrete, glass:R.glass, frame:R.metal, accent:R.nblue },
    mint:    { name:"Mint ミント",         body:R.mint,   glass:R.glassW, frame:R.white, accent:R.ngreen },
  },
  danchi: {
    danchi:  { name:"Danchi gray 団地",    body:R.concrete, glass:R.glass, frame:R.metal, accent:R.npink },
    beige:   { name:"Beige ベージュ",      body:R.beige,  glass:R.glassW, frame:R.cream, accent:R.nyel },
    mint:    { name:"Mint ミント",         body:R.mint,   glass:R.glass,  frame:R.white, accent:R.ngreen },
  },
  commercial: {
    family:  { name:"Family cream 郊外SC", body:R.cream,   glass:R.glass,   frame:R.white,  accent:R.nyel },
    station: { name:"Station granite 駅",  body:R.granite, glass:R.glass,   frame:R.metal,  accent:R.nblue },
    fashion: { name:"Fashion black ファッション", body:R.black, glass:R.curtain, frame:R.steelD, accent:R.npink },
  },
};

function rampsFor(p) {
  const pal = PALETTES[p.type][p.palette];
  const t = [];
  t[MAT.BODY] = pal.body; t[MAT.GLASS] = pal.glass; t[MAT.FRAME] = pal.frame; t[MAT.ACCENT] = pal.accent;
  t[MAT.CONCRETE] = R.concrete; t[MAT.METAL] = R.metal; t[MAT.ALU] = R.alu; t[MAT.STEEL] = R.steelD;
  t[MAT.ROOF] = R.roof; t[MAT.GREEN] = R.green; t[MAT.WHITE] = R.white; t[MAT.BLACK] = R.black;
  t[MAT.GLASS_W] = R.glassW; t[MAT.SIGN] = R.sign; t[MAT.WOOD] = R.wood; t[MAT.ASPHALT] = R.asphalt;
  t[MAT.NRED] = R.nred; t[MAT.NBLUE] = R.nblue; t[MAT.NYEL] = R.nyel; t[MAT.NGREEN] = R.ngreen; t[MAT.NPINK] = R.npink;
  return t;
}

// ---------------------------------------------------------------- constants
// FH keeps the per-type *default* floor-to-floor height; the live value is
// p.floorHeight (clamped to FLOOR_HEIGHT_RANGE) so ordinary buildings are parametric.
const FH = { office: 3.6, residential: 3.0, hotel: 3.4, department: 4.2, hospital: 3.8, danchi: 2.9, commercial: 4.0 };
const FLOOR_HEIGHT_RANGE = [2.8, 4.6];
const TYPES = ["office", "residential", "hotel", "department", "hospital", "danchi", "commercial"];
const NEW_TYPES = ["hotel", "department", "hospital", "danchi", "commercial"];
const ORDINARY_TYPES = ["office", "residential", "hotel", "department", "hospital", "danchi", "commercial"];
// forms that respond to the `ac` knob (new ordinary forms only — existing defaults untouched)
const AC_ROW_FORMS = ["O11", "O12", "O13", "O14", "R4", "R5", "R6", "R7",
  "HO1", "HO2", "DP1", "DP2", "HP1", "HP2", "DC1", "DC2", "CM1", "CM2", "CM3", "CM4"];
const FLOOR_RANGE = {
  office: [3, 22], residential: [2, 18],
  hotel: [4, 26], department: [3, 8], hospital: [3, 14], danchi: [3, 12], commercial: [1, 12],
};
const FORMS = {
  office: ["O1", "O2", "O3", "O4", "O5", "O6", "O7", "O8", "O9", "O10", "O11", "O12", "O13", "O14"],
  residential: ["R1", "R2", "R3", "R4", "R5", "R6", "R7"],
  hotel: ["HO1", "HO2"],
  department: ["DP1", "DP2"],
  hospital: ["HP1", "HP2"],
  danchi: ["DC1", "DC2"],
  commercial: ["CM1", "CM2", "CM3", "CM4"],
};
const FORM_NAMES = {
  O1: "Pencil ペンシルビル", O2: "Setback 斜線ビル", O3: "Grid 都庁風",
  O4: "Cocoon コクーン", O5: "Capsule 中銀カプセル",
  O6: "Standard 标准办公", O7: "Tenant 雑居ビル", O8: "Glass box 玻璃盒子",
  O9: "Low-rise 低层办公", O10: "Ribbon 带窗办公",
  O11: "Terrace setback 階段状テラス", O12: "Curtain wall ガラスカーテン",
  O13: "Shop-office 店舗併用ビル", O14: "Twin towers ツインタワー",
  R1: "Mansion マンション", R2: "Apaato アパート", R3: "Tower mansion タワーマンション",
  R4: "Low mansion 低層マンション", R5: "Open corridor 外廊下型",
  R6: "Stair riser 階段室型", R7: "Shop mansion 店舗併用マンション",
  HO1: "City hotel シティホテル", HO2: "Business hotel ビジネスホテル",
  DP1: "Department 百貨店", DP2: "Shopping centre ショッピングセンター",
  HP1: "General hospital 総合病院", HP2: "Ward block 病棟",
  DC1: "Danchi slab 団地", DC2: "Public housing 公団住宅",
  CM1: "Suburban SC 郊外SC", CM2: "Station building 駅ビル",
  CM3: "Fashion building ファッションビル", CM4: "Big-box store 大型量販店",
};
// per-form floor range + auto-width formula (base + floors*k clamped) + depth ratio
const FORM_META = {
  O1: { floors: [8, 15], base: 6,  k: 0.20, lo: 6,  hi: 9,  depthK: 1.20 },
  O2: { floors: [5, 14], base: 10, k: 0.50, lo: 12, hi: 22, depthK: 0.80 },
  O3: { floors: [8, 22], base: 14, k: 0.60, lo: 16, hi: 28, depthK: 0.85 },
  O4: { floors: [10, 22], base: 12, k: 0.50, lo: 14, hi: 24, depthK: 0.90 },
  O5: { floors: [6, 14], base: 10, k: 0.40, lo: 12, hi: 20, depthK: 0.90 },
  O6: { floors: [6, 15], base: 12, k: 0.50, lo: 12, hi: 20, depthK: 0.80 },
  O7: { floors: [5, 10], base: 8,  k: 0.40, lo: 8,  hi: 12, depthK: 0.90 },
  O8: { floors: [8, 20], base: 12, k: 0.50, lo: 14, hi: 24, depthK: 0.85 },
  O9: { floors: [3, 5],  base: 10, k: 1.20, lo: 10, hi: 16, depthK: 0.75 },
  O10: { floors: [6, 12], base: 12, k: 0.60, lo: 12, hi: 20, depthK: 0.80 },
  R1: { floors: [5, 12], base: 12, k: 0.80, lo: 14, hi: 26, depthK: 0.75 },
  R2: { floors: [2, 3],  base: 10, k: 2.00, lo: 12, hi: 20, depthK: 0.60 },
  R3: { floors: [12, 18], base: 11, k: 0.50, lo: 13, hi: 22, depthK: 0.80 },
  R4: { floors: [3, 5],  base: 12, k: 1.60, lo: 16, hi: 24, depthK: 0.80 },
  R5: { floors: [3, 6],  base: 13, k: 1.50, lo: 18, hi: 26, depthK: 0.60 },
  R6: { floors: [4, 5],  base: 16, k: 2.20, lo: 20, hi: 28, depthK: 0.72 },
  R7: { floors: [4, 10], base: 12, k: 0.70, lo: 14, hi: 20, depthK: 0.80 },
  O11: { floors: [6, 14], base: 14, k: 0.70, lo: 16, hi: 24, depthK: 0.80 },
  O12: { floors: [8, 20], base: 14, k: 0.50, lo: 16, hi: 26, depthK: 0.85 },
  O13: { floors: [3, 6],  base: 9,  k: 1.20, lo: 10, hi: 14, depthK: 0.90 },
  O14: { floors: [10, 20], base: 18, k: 0.70, lo: 20, hi: 30, depthK: 0.80 },
  HO1: { floors: [8, 26], base: 12, k: 0.45, lo: 14, hi: 22, depthK: 0.78 },
  HO2: { floors: [5, 14], base: 12, k: 0.70, lo: 14, hi: 22, depthK: 0.62 },
  DP1: { floors: [4, 8],  base: 18, k: 1.40, lo: 20, hi: 30, depthK: 0.80 },
  DP2: { floors: [3, 6],  base: 20, k: 2.00, lo: 24, hi: 34, depthK: 0.95 },
  HP1: { floors: [4, 14], base: 16, k: 1.10, lo: 20, hi: 32, depthK: 0.55 },
  HP2: { floors: [5, 14], base: 14, k: 0.90, lo: 18, hi: 26, depthK: 0.75 },
  DC1: { floors: [3, 12], base: 18, k: 2.40, lo: 26, hi: 36, depthK: 0.42 },
  DC2: { floors: [4, 12], base: 16, k: 1.50, lo: 22, hi: 34, depthK: 0.55 },
  CM1: { floors: [3, 6],  base: 22, k: 2.00, lo: 26, hi: 34, depthK: 0.90 },
  CM2: { floors: [4, 8],  base: 22, k: 2.00, lo: 26, hi: 34, depthK: 0.55 },
  CM3: { floors: [8, 12], base: 8,  k: 0.45, lo: 9,  hi: 12, depthK: 0.95 },
  CM4: { floors: [1, 2],  base: 24, k: 2.00, lo: 26, hi: 30, depthK: 0.55 },
};
const BILLBOARDS = ["none", "rooftop", "vertical", "horizontal", "pole"];
const DENSITIES = ["sparse", "normal", "dense"];
const CAP = { W: 140, D: 120, H: 500 };
const LIGHT = (function () { const l = [0.45, 0.5, 0.8], m = Math.hypot(l[0], l[1], l[2]); return [l[0]/m, l[1]/m, l[2]/m]; })();
const OUTLINE = [24, 26, 32];

// live per-parameter floor height (metres). FH stays the default source.
function fhOf(p) {
  const v = p ? Number(p.floorHeight) : NaN;
  if (Number.isFinite(v) && v > 0) return v;
  return (p && FH[p.type]) || FH.office;
}

function defaultParams() {
  return {
    type: "office", form: "O6", palette: "white", floors: 10, widthFactor: 1.0,
    floorHeight: FH.office, scale: 4,
    billboard: "none", balconies: true, ac: true, crown: false, mechanical: true,
    antenna: false, lobby: true, garden: false, neon: false, density: "normal", seed: 1,
    rooftopClutter: true, verticalSign: false, tileFacade: true, acUnits: true, helipad: false,
  };
}

function normalizeParams(q) {
  const d = defaultParams();
  const p = Object.assign({}, d, q || {});
  p.type = TYPES.indexOf(p.type) >= 0 ? p.type : "office";
  if (FORMS[p.type].indexOf(p.form) < 0) p.form = FORMS[p.type][0];
  if (!PALETTES[p.type][p.palette]) p.palette = Object.keys(PALETTES[p.type])[0];
  const fr = (FORM_META[p.form] || {}).floors || FLOOR_RANGE[p.type] || FLOOR_RANGE.office;
  p.floors = clamp(Math.round(Number(p.floors) || fr[0]), fr[0], fr[1]);
  p.widthFactor = clamp(Number(p.widthFactor) || 1, 0.7, 1.4);
  const qFh = q && q.floorHeight != null && q.floorHeight !== "" ? Number(q.floorHeight) : NaN;
  p.floorHeight = Number.isFinite(qFh)
    ? clamp(Math.round(qFh * 10) / 10, FLOOR_HEIGHT_RANGE[0], FLOOR_HEIGHT_RANGE[1])
    : (FH[p.type] || FH.office);
  p.scale = [4, 6, 8].indexOf(Number(p.scale)) >= 0 ? Number(p.scale) : 4;
  if (BILLBOARDS.indexOf(p.billboard) < 0) p.billboard = "none";
  if (DENSITIES.indexOf(p.density) < 0) p.density = "normal";
  for (const k of ["balconies","ac","crown","mechanical","antenna","lobby","garden","neon",
                   "rooftopClutter","verticalSign","tileFacade","acUnits","helipad"]) p[k] = !!p[k];
  p.seed = Math.abs(Math.round(Number(p.seed) || 0)) % 1000000007;
  return p;
}

function computeWidthM(p) {
  const fm = FORM_META[p.form] || FORM_META.O1;
  return clamp(fm.base + p.floors * fm.k, fm.lo, fm.hi) * p.widthFactor;
}
function computeDepthM(p) {
  const fm = FORM_META[p.form] || FORM_META.O1;
  return computeWidthM(p) * fm.depthK;
}

function randomParams(seed, forceType, forceForm) {
  const rng = mulberry32(seed >>> 0);
  const typePool = ["office", "office", "office", "residential", "residential",
                    "hotel", "hotel", "department", "hospital", "danchi", "commercial", "commercial"];
  const type = (forceType && TYPES.indexOf(forceType) >= 0) ? forceType : pick(rng, typePool);
  // weight everyday ordinary offices (O6–O10) more than the quirky landmarks
  const officePool = ["O6","O6","O7","O7","O8","O8","O9","O10","O10","O13","O13","O12","O11","O1","O1","O2","O3","O4","O5","O14"];
  const form = forceForm && FORMS[type].indexOf(forceForm) >= 0 ? forceForm
    : (type === "office" ? pick(rng, officePool) : pick(rng, FORMS[type]));
  const fr = FORM_META[form].floors;
  const office = type === "office";
  const fhRange = {
    office: [3.2, 4.2], residential: [2.8, 3.3], hotel: [3.1, 3.8],
    department: [3.8, 4.6], hospital: [3.5, 4.2], danchi: [2.8, 3.1], commercial: [3.6, 4.4],
  }[type] || [2.8, 4.6];
  const fh = Math.round((fhRange[0] + rng() * (fhRange[1] - fhRange[0])) * 10) / 10;
  return normalizeParams({
    type, form, palette: pick(rng, Object.keys(PALETTES[type])),
    floors: ri(rng, fr[0], fr[1]), widthFactor: 0.85 + rng() * 0.45,
    floorHeight: fh, scale: 4,
    billboard: pick(rng, ["none", "none", "rooftop", "vertical", "horizontal", "pole"]),
    balconies: chance(rng, 0.85), ac: chance(rng, 0.75), crown: chance(rng, 0.4),
    mechanical: chance(rng, 0.7), antenna: chance(rng, 0.4), lobby: chance(rng, 0.85),
    garden: chance(rng, 0.35), neon: chance(rng, 0.45),
    rooftopClutter: chance(rng, 0.8), verticalSign: form === "O7" ? chance(rng, 0.9) : (office ? chance(rng, 0.4) : chance(rng, 0.35)),
    tileFacade: (form === "O6" || form === "O9") ? chance(rng, 0.8) : (office ? chance(rng, 0.3) : chance(rng, 0.7)),
    acUnits: chance(rng, 0.7), helipad: type === "hospital" ? chance(rng, 0.65) : false,
    density: pick(rng, ["sparse", "normal", "normal", "dense"]), seed,
  });
}

// ---------------------------------------------------------------- Model
class Model {
  constructor(W, D, H) {
    this.W = W; this.D = D; this.H = H;
    this.mat = new Uint8Array(W * D * H);
  }
  get(x, y, z) {
    x = Math.round(x); y = Math.round(y); z = Math.round(z);
    if (x < 0 || y < 0 || z < 0 || x >= this.W || y >= this.D || z >= this.H) return 0;
    return this.mat[z * this.W * this.D + y * this.W + x];
  }
  set(x, y, z, m) {
    x = Math.round(x); y = Math.round(y); z = Math.round(z);
    if (x < 0 || y < 0 || z < 0 || x >= this.W || y >= this.D || z >= this.H) return;
    this.mat[z * this.W * this.D + y * this.W + x] = m;
  }
  boxR(x0, x1, y0, y1, z0, z1, m) {
    const W = this.W, D = this.D, H = this.H, mat = this.mat;
    let xa = Math.max(0, Math.round(x0)), xb = Math.min(W - 1, Math.round(x1));
    let ya = Math.max(0, Math.round(y0)), yb = Math.min(D - 1, Math.round(y1));
    let za = Math.max(0, Math.round(z0)), zb = Math.min(H - 1, Math.round(z1));
    if (xb < xa || yb < ya || zb < za) return;
    for (let z = za; z <= zb; z++) {
      const base = z * W * D;
      for (let y = ya; y <= yb; y++) mat.fill(m, base + y * W + xa, base + y * W + xb + 1);
    }
  }
  boxC(cx, cy, cz, hx, hy, hz, m) { this.boxR(cx - hx, cx + hx, cy - hy, cy + hy, cz - hz, cz + hz, m); }
  cylZ(cx, cy, z0, z1, rx, ry, m) {
    const W = this.W, D = this.D, H = this.H, mat = this.mat;
    const za = Math.max(0, Math.round(z0)), zb = Math.min(H - 1, Math.round(z1));
    if (zb < za || rx <= 0 || ry <= 0) return;
    const ya = Math.max(0, Math.floor(cy - ry)), yb = Math.min(D - 1, Math.ceil(cy + ry));
    for (let z = za; z <= zb; z++) {
      const base = z * W * D;
      for (let y = ya; y <= yb; y++) {
        const dy = (y - cy) / ry, t = 1 - dy * dy;
        if (t < 0) continue;
        const dx = rx * Math.sqrt(t);
        const xa = Math.max(0, Math.round(cx - dx)), xb = Math.min(W - 1, Math.round(cx + dx));
        if (xb >= xa) mat.fill(m, base + y * W + xa, base + y * W + xb + 1);
      }
    }
  }
  ell(cx, cy, cz, rx, ry, rz, m) {
    const W = this.W, D = this.D, H = this.H, mat = this.mat;
    const za = Math.max(0, Math.floor(cz - rz)), zb = Math.min(H - 1, Math.ceil(cz + rz));
    if (zb < za || rx <= 0 || ry <= 0 || rz <= 0) return;
    for (let z = za; z <= zb; z++) {
      const dz = (z - cz) / rz, t0 = 1 - dz * dz;
      if (t0 < 0) continue;
      const base = z * W * D;
      const ya = Math.max(0, Math.floor(cy - ry)), yb = Math.min(D - 1, Math.ceil(cy + ry));
      for (let y = ya; y <= yb; y++) {
        const dy = (y - cy) / ry, t = t0 - dy * dy;
        if (t < 0) continue;
        const dx = rx * Math.sqrt(t);
        const xa = Math.max(0, Math.round(cx - dx)), xb = Math.min(W - 1, Math.round(cx + dx));
        if (xb >= xa) mat.fill(m, base + y * W + xa, base + y * W + xb + 1);
      }
    }
  }
  gable(cx, cy, zb, hx, hy, h, m, ridge) {
    const za = Math.max(0, Math.round(zb)), zt = Math.min(this.H - 1, Math.round(zb + h));
    for (let z = za; z <= zt; z++) {
      const t = clamp((z - zb) / h, 0, 1);
      const sx = ridge === "x" ? hx : hx * (1 - t);
      const sy = ridge === "x" ? hy * (1 - t) : hy;
      this.boxR(cx - sx, cx + sx, cy - sy, cy + sy, z, z, m);
    }
  }
  hip(cx, cy, zb, hx, hy, h, m) {
    const za = Math.max(0, Math.round(zb)), zt = Math.min(this.H - 1, Math.round(zb + h));
    for (let z = za; z <= zt; z++) {
      const t = clamp((z - zb) / h, 0, 1);
      this.boxR(cx - hx * (1 - t), cx + hx * (1 - t), cy - hy * (1 - t), cy + hy * (1 - t), z, z, m);
    }
  }
}

// ---------------------------------------------------------------- facade helpers
function paintFace(M, face, a0, a1, z0, z1, m, depth) {
  depth = depth || 1;
  const W = M.W, D = M.D, H = M.H;
  const horiz = (face === "front" || face === "back") ? W : D;
  const aa = Math.max(0, Math.round(a0)), ab = Math.min(horiz - 1, Math.round(a1));
  const za = Math.max(0, Math.round(z0)), zz = Math.min(H - 1, Math.round(z1));
  if (ab < aa || zz < za) return;
  for (let z = za; z <= zz; z++) {
    for (let a = aa; a <= ab; a++) {
      if (face === "front") {
        for (let y = D - 1; y >= 0; y--) if (M.get(a, y, z)) {
          for (let d = 0; d < depth; d++) if (M.get(a, y - d, z)) M.set(a, y - d, z, m);
          break;
        }
      } else if (face === "back") {
        for (let y = 0; y < D; y++) if (M.get(a, y, z)) {
          for (let d = 0; d < depth; d++) if (M.get(a, y + d, z)) M.set(a, y + d, z, m);
          break;
        }
      } else if (face === "right") {
        for (let x = W - 1; x >= 0; x--) if (M.get(x, a, z)) {
          for (let d = 0; d < depth; d++) if (M.get(x - d, a, z)) M.set(x - d, a, z, m);
          break;
        }
      } else {
        for (let x = 0; x < W; x++) if (M.get(x, a, z)) {
          for (let d = 0; d < depth; d++) if (M.get(x + d, a, z)) M.set(x + d, a, z, m);
          break;
        }
      }
    }
  }
}
function faceRange(face, cx, cy, hw, hd) {
  return (face === "front" || face === "back") ? [cx - hw, cx + hw] : [cy - hd, cy + hd];
}
const FACES = ["front", "back", "left", "right"];

// surface plane coordinate of a face at column a, height z (scans inward)
function facePlane(M, face, a, z) {
  a = Math.round(a); z = Math.round(z);
  if (face === "front") { for (let y = M.D - 1; y >= 0; y--) if (M.get(a, y, z)) return y; }
  else if (face === "back") { for (let y = 0; y < M.D; y++) if (M.get(a, y, z)) return y; }
  else if (face === "right") { for (let x = M.W - 1; x >= 0; x--) if (M.get(x, a, z)) return x; }
  else { for (let x = 0; x < M.W; x++) if (M.get(x, a, z)) return x; }
  return -1;
}

function curtainWall(M, face, a0, a1, z0, z1, s, density, fh, rng) {
  paintFace(M, face, a0, a1, z0, z1, MAT.GLASS, 2);
  const bandH = Math.max(1, 0.32 * s);
  for (let z = Math.ceil(z0 / (fh * s)) * fh * s; z <= z1; z += fh * s) {
    if (z >= z0) paintFace(M, face, a0, a1, z - bandH / 2, z + bandH / 2, MAT.FRAME, 2);
  }
  const spacingM = density === "sparse" ? 4.2 : density === "dense" ? 1.7 : 2.8;
  const pierW = Math.max(1, 0.22 * s), du = spacingM * s;
  const phase = rng ? rng() * du : 0;
  for (let a = a0 - du + phase; a <= a1 + 0.001; a += du) paintFace(M, face, a - pierW / 2, a + pierW / 2, z0, z1, MAT.FRAME, 2);
}

// horizontal floor spandrel bands (ordinary office facade)
function spandrelBands(M, face, a0, a1, z0, z1, fh, s) {
  const bandH = Math.max(1, 0.35 * s);
  for (let z = Math.ceil(z0 / (fh * s)) * fh * s; z <= z1; z += fh * s)
    if (z >= z0) paintFace(M, face, a0, a1, z - bandH / 2, z + bandH / 2, MAT.FRAME, 2);
}

function punchedWindows(M, face, a0, a1, z0, floors, fh, s, density, rng) {
  const spacingM = density === "sparse" ? 3.6 : density === "dense" ? 1.9 : 2.6;
  const frac = density === "sparse" ? 0.45 : density === "dense" ? 0.62 : 0.55;
  const sill = 0.9, winH = 1.5, du = spacingM * s;
  const n = Math.max(1, Math.floor((a1 - a0) / du));
  const off = (a1 - a0 - n * du) / 2 + (rng ? (rng() - 0.5) * du * 0.4 : 0);
  for (let f = 0; f < floors; f++) {
    const zb = z0 + f * fh * s;
    for (let i = 0; i < n; i++) {
      const ua = a0 + off + i * du + du * (1 - frac) / 2;
      const ub = a0 + off + (i + 1) * du - du * (1 - frac) / 2;
      paintFace(M, face, ua, ub, zb + sill * s, zb + (sill + winH) * s, MAT.GLASS, 2);
      paintFace(M, face, ua - 0.1 * s, ub + 0.1 * s, zb + (sill - 0.14) * s, zb + sill * s, MAT.FRAME, 2);
    }
  }
}

// fine tile-clad grid lines (タイル貼り)
// stepMul > 1 makes a sparser, larger-format tile grid (ordinary types keep their body colour)
function tileTexture(M, face, a0, a1, z0, z1, s, stepMul) {
  const k = stepMul || 1;
  const hStep = 0.6 * s * k, vStep = 0.9 * s * k, t = Math.max(1, 0.08 * s);
  for (let z = z0; z <= z1; z += hStep) paintFace(M, face, a0, a1, z, z + t, MAT.FRAME, 2);
  for (let a = a0; a <= a1; a += vStep) paintFace(M, face, a, a + t, z0, z1, MAT.FRAME, 2);
}

function ringPaint(M, z0, z1, m) {
  const W = M.W, D = M.D, H = M.H, mat = M.mat, WD = W * D;
  const za = Math.max(0, Math.round(z0)), zz = Math.min(H - 1, Math.round(z1));
  for (let z = za; z <= zz; z++) {
    const base = z * WD;
    for (let y = 0; y < D; y++) {
      const row = base + y * W;
      for (let x = 0; x < W; x++) {
        const i = row + x;
        if (!mat[i]) continue;
        if (x === 0 || x === W - 1 || y === 0 || y === D - 1 ||
            !mat[i - 1] || !mat[i + 1] || !mat[i - W] || !mat[i + W]) {
          mat[i] = m;
          if (x > 0 && mat[i - 1] && mat[i - 1] !== m) mat[i - 1] = m;
          if (x < W - 1 && mat[i + 1] && mat[i + 1] !== m) mat[i + 1] = m;
          if (y > 0 && mat[i - W] && mat[i - W] !== m) mat[i - W] = m;
          if (y < D - 1 && mat[i + W] && mat[i + W] !== m) mat[i + W] = m;
        }
      }
    }
  }
}

function railing(M, x0, x1, y0, y1, z, s, h) {
  h = h == null ? 1.0 : h;
  const t = Math.max(1, 0.12 * s), zh = z + h * s;
  M.boxR(x0, x1, y0, y0 + t, z, zh, MAT.METAL);
  M.boxR(x0, x1, y1 - t, y1, z, zh, MAT.METAL);
  M.boxR(x0, x0 + t, y0, y1, z, zh, MAT.METAL);
  M.boxR(x1 - t, x1, y0, y1, z, zh, MAT.METAL);
}
function planter(M, x, y, z, s) {
  M.boxC(x, y, z + 0.25 * s, 0.6 * s, 0.4 * s, 0.25 * s, MAT.WOOD);
  M.boxC(x, y, z + 0.62 * s, 0.5 * s, 0.3 * s, 0.22 * s, MAT.GREEN);
}
function terrace(M, cx, cy, hw, hd, z, s, garden, rng, slabMat) {
  M.boxR(cx - hw, cx + hw, cy - hd, cy + hd, z, z + Math.max(1, 0.15 * s), slabMat || MAT.ROOF_M);
  railing(M, cx - hw, cx + hw, cy - hd, cy + hd, z + 0.15 * s, s, 1.0);
  if (garden) {
    const n = ri(rng, 2, 4);
    for (let i = 0; i < n; i++) planter(M, cx + (rng() * 2 - 1) * (hw - 1.2 * s), cy + (rng() * 2 - 1) * (hd - 1.2 * s), z + 0.15 * s, s);
  }
}

// AC outdoor unit: small white box + dark grille decal on its outward face
function acBox(M, face, a, z, s) {
  const plane = facePlane(M, face, a, z);
  if (plane < 0) return;
  const w = 0.7 * s, d = 0.32 * s, h = 0.55 * s, t = Math.max(1, 0.08 * s);
  if (face === "front" || face === "back") {
    const sgn = face === "front" ? 1 : -1;
    const y0 = face === "front" ? plane : plane - d, y1 = face === "front" ? plane + d : plane;
    M.boxR(a - w / 2, a + w / 2, y0, y1, z, z + h, MAT.WHITE);
    const yg = face === "front" ? y1 - t : y0;
    M.boxR(a - w / 2 + t, a + w / 2 - t, yg, yg + t, z + h * 0.35, z + h * 0.5, MAT.STEEL);
    M.boxR(a - w / 2 + t, a + w / 2 - t, yg, yg + t, z + h * 0.6, z + h * 0.72, MAT.STEEL);
  } else {
    const x0 = face === "right" ? plane : plane - d, x1 = face === "right" ? plane + d : plane;
    M.boxR(x0, x1, a - w / 2, a + w / 2, z, z + h, MAT.WHITE);
    const xg = face === "right" ? x1 - t : x0;
    M.boxR(xg, xg + t, a - w / 2 + t, a + w / 2 - t, z + h * 0.35, z + h * 0.5, MAT.STEEL);
    M.boxR(xg, xg + t, a - w / 2 + t, a + w / 2 - t, z + h * 0.6, z + h * 0.72, MAT.STEEL);
  }
}

// mansion continuous balcony partitioned by party walls (戸境壁) + AC per unit
function mansionBalcony(M, face, a0, a1, z, s, fh, unitM, withAC, rng) {
  const aMid = (a0 + a1) / 2;
  const plane = facePlane(M, face, aMid, z + 0.3 * s);
  if (plane < 0) return;
  const depth = 1.5 * s, t = Math.max(1, 0.12 * s), slabT = Math.max(1, 0.25 * s);
  const unit = unitM * s;
  if (face === "front" || face === "back") {
    const y0 = face === "front" ? plane : plane - depth, y1 = face === "front" ? plane + depth : plane;
    M.boxR(a0, a1, y0, y1, z, z + slabT, MAT.CONCRETE);                 // continuous slab
    const yr = face === "front" ? y1 - t : y0;
    M.boxR(a0, a1, yr, yr + t, z, z + 1.0 * s, MAT.METAL);              // continuous rail
    for (let a = a0; a <= a1 + 0.01; a += unit)                          // party walls
      M.boxR(a - t / 2, a + t / 2, y0, y1, z, z + fh * s, MAT.CONCRETE);
    if (withAC) for (let a = a0 + unit / 2; a < a1; a += unit)
      if (chance(rng, 0.85)) acBox(M, face, a + (rng() - 0.5) * unit * 0.3, z + slabT, s);
  } else {
    const x0 = face === "right" ? plane : plane - depth, x1 = face === "right" ? plane + depth : plane;
    M.boxR(x0, x1, a0, a1, z, z + slabT, MAT.CONCRETE);
    const xr = face === "right" ? x1 - t : x0;
    M.boxR(xr, xr + t, a0, a1, z, z + 1.0 * s, MAT.METAL);
    for (let a = a0; a <= a1 + 0.01; a += unit)
      M.boxR(x0, x1, a - t / 2, a + t / 2, z, z + fh * s, MAT.CONCRETE);
    if (withAC) for (let a = a0 + unit / 2; a < a1; a += unit)
      if (chance(rng, 0.85)) acBox(M, face, a + (rng() - 0.5) * unit * 0.3, z + slabT, s);
  }
}

// ground-floor shop / pilotis glass with signage band, awning, noren
function shopFront(M, cx, hw, s, fh, rng, noren) {
  const h = Math.min(3.2, fh * 0.92);
  paintFace(M, "front", cx - hw + 0.4 * s, cx + hw - 0.4 * s, 0.3 * s, h * s, MAT.GLASS_W, 2);
  paintFace(M, "front", cx - 0.9 * s, cx + 0.9 * s, 0.3 * s, Math.min(2.5, h) * s, MAT.GLASS, 2);
  const plane = facePlane(M, "front", cx, h * s);
  if (plane >= 0) {
    M.boxR(cx - hw, cx + hw, plane, plane + 0.25 * s, h * s, h * s + 0.5 * s, MAT.SIGN);   // sign band
    M.boxR(cx - hw, cx + hw, plane + 0.2 * s, plane + 0.3 * s, h * s + 0.1 * s, h * s + 0.4 * s, pick(rng, NEONS));
    M.boxR(cx - hw + 0.3 * s, cx + hw - 0.3 * s, plane, plane + 1.1 * s, h * s + 0.5 * s, h * s + 0.62 * s, MAT.ALU); // awning
    if (noren) {                                                                            // noren curtain
      const ny = plane + 1.0 * s;
      for (let a = cx - hw + 0.6 * s; a < cx + hw - 0.6 * s; a += 0.7 * s)
        M.boxR(a, a + 0.5 * s, ny, ny + 0.1 * s, h * s + 0.1 * s, h * s + 0.45 * s, MAT.NRED);
    }
  }
}

// external zigzag evacuation stair on the right face (pencil building feature)
function externalStair(M, s, cx, cy, hwM, hdM, floors, fh) {
  const runLen = Math.min(hdM * 1.1, 4) * s, prot = 1.1 * s, n = 6;
  const rise = fh * s / n, run = runLen / n, t = Math.max(1, 0.1 * s);
  for (let f = 0; f < floors; f++) {
    const dir = f % 2 === 0 ? 1 : -1, z0 = f * fh * s;
    const yStart = dir > 0 ? cy - runLen / 2 : cy + runLen / 2;
    const xw = facePlane(M, "right", cy, z0 + fh * s / 2);
    if (xw < 0) continue;
    for (let i = 0; i < n; i++) {
      const ya = yStart + dir * i * run, yb = ya + dir * run;
      const y0 = Math.min(ya, yb), y1 = Math.max(ya, yb);
      M.boxR(xw, xw + prot, y0, y1, z0, z0 + (i + 1) * rise, MAT.CONCRETE);
      M.boxR(xw + prot - t, xw + prot, y0, y0 + t, z0 + (i + 1) * rise, z0 + (i + 1) * rise + 1.0 * s, MAT.METAL);
    }
    const yEnd = yStart + dir * runLen;
    M.boxR(xw, xw + prot, yEnd - 0.6 * s, yEnd + 0.6 * s, z0 + fh * s - 0.2 * s, z0 + fh * s, MAT.CONCRETE);
  }
}

// round capsule window: dark glass disk + frame ring on a known face plane
function roundWindow(M, face, aC, zC, plane, r, s) {
  const ri2 = r * r, ro = (r + Math.max(1, 0.16 * s)) * (r + Math.max(1, 0.16 * s));
  for (let a = Math.floor(aC - r - 1); a <= Math.ceil(aC + r + 1); a++) {
    for (let z = Math.floor(zC - r - 1); z <= Math.ceil(zC + r + 1); z++) {
      const d2 = (a - aC) * (a - aC) + (z - zC) * (z - zC);
      if (d2 > ro) continue;
      const m = d2 <= ri2 ? MAT.GLASS : MAT.FRAME;
      if (face === "front") { if (M.get(a, plane, z)) { M.set(a, plane, z, m); M.set(a, plane - 1, z, m); } }
      else if (face === "back") { if (M.get(a, plane, z)) { M.set(a, plane, z, m); M.set(a, plane + 1, z, m); } }
      else if (face === "right") { if (M.get(plane, a, z)) { M.set(plane, a, z, m); M.set(plane - 1, a, z, m); } }
      else { if (M.get(plane, a, z)) { M.set(plane, a, z, m); M.set(plane + 1, a, z, m); } }
    }
  }
}

// ================================================================ ordinary-type kit
// continuous floor spandrel band (腰線 / 床梁) at every floor line, absolute metre gauge
function bandLines(M, face, a0, a1, z0, z1, fh, s, hM, m) {
  const bh = Math.max(1, hM * s);
  for (let z = z0 + fh * s; z <= z1 + 0.001; z += fh * s)
    paintFace(M, face, a0, a1, z - bh / 2, z + bh / 2, m, 2);
}

// hotel guestroom windows: two tall narrow windows per room bay between floor bands
function guestRoomWindows(M, face, a0, a1, zBase, rows, fh, s, density, rng) {
  if (rows <= 0) return;
  const bay = (density === "sparse" ? 4.4 : density === "dense" ? 2.9 : 3.6) * s;
  const winW = Math.max(1, 0.6 * s), gap = Math.max(1, 0.42 * s);
  const sill = Math.max(1, Math.min(0.4 * s, 0.24 * fh * s));
  for (let f = 0; f < rows; f++) {
    const zb = zBase + f * fh * s;
    const za = zb + Math.max(1, Math.min(0.55 * s, 0.16 * fh * s));
    const zc = zb + fh * s - Math.max(1, Math.min(0.5 * s, 0.14 * fh * s));
    const jitter = rng ? (rng() - 0.5) * 0.12 * s : 0;
    for (let a = a0 + bay * 0.5 + jitter; a + bay * 0.3 < a1; a += bay) {
      paintFace(M, face, a - gap - winW, a - gap, za, zc, MAT.GLASS, 2);
      paintFace(M, face, a + gap, a + gap + winW, za, zc, MAT.GLASS, 2);
      paintFace(M, face, a - gap - winW - 0.12 * s, a + gap + winW + 0.12 * s, za - sill, za, MAT.FRAME, 2);
    }
  }
}

// hospital ward ribbon windows: continuous glazing with regular mullions
function ribbonWindows(M, face, a0, a1, zBase, rows, fh, s, density) {
  if (rows <= 0) return;
  const mull = (density === "sparse" ? 3.4 : density === "dense" ? 1.8 : 2.5) * s;
  const sill = 0.85, top = Math.min(fh - 0.5, 2.6);
  for (let f = 0; f < rows; f++) {
    const zb = zBase + f * fh * s;
    const z0 = zb + Math.max(1, sill * s), z1 = zb + Math.max(sill + 0.8, top) * s;
    paintFace(M, face, a0, a1, z0, z1, MAT.GLASS, 2);
    paintFace(M, face, a0, a1, z0 - Math.max(1, 0.1 * s), z0, MAT.FRAME, 2);
    for (let a = a0; a <= a1 + 0.01; a += mull)
      paintFace(M, face, a, a + Math.max(1, 0.1 * s), z0, z1, MAT.FRAME, 2);
  }
}

// protruding horizontal canopy (雨棚) at one floor line
function canopyBand(M, face, a0, a1, z, s, depthM, m) {
  const mid = (a0 + a1) / 2;
  const plane = facePlane(M, face, mid, z - 1);
  if (plane < 0) return;
  const d = Math.max(1, depthM * s), t = Math.max(1, 0.3 * s), z0 = z - t, z1 = z;
  if (face === "front") M.boxR(a0, a1, plane, plane + d, z0, z1, m || MAT.ALU);
  else if (face === "back") M.boxR(a0, a1, plane - d, plane, z0, z1, m || MAT.ALU);
  else if (face === "right") M.boxR(plane, plane + d, a0, a1, z0, z1, m || MAT.ALU);
  else M.boxR(plane - d, plane, a0, a1, z0, z1, m || MAT.ALU);
}

// open external corridor (外廊下): slab + rail + thin posts, optional AC / laundry clutter
function openCorridor(M, face, a0, a1, z, s, fh, withAC, clutter, rng) {
  const mid = (a0 + a1) / 2;
  const plane = facePlane(M, face, mid, z + Math.max(1, 0.3 * s));
  if (plane < 0) return;
  const depth = Math.max(1, 1.4 * s), t = Math.max(1, 0.12 * s), slabT = Math.max(1, 0.22 * s);
  const postT = Math.max(1, 0.14 * s);
  if (face === "front" || face === "back") {
    const y0 = face === "front" ? plane : plane - depth, y1 = face === "front" ? plane + depth : plane;
    M.boxR(a0, a1, y0, y1, z, z + slabT, MAT.CONCRETE);
    const yr = face === "front" ? y1 - t : y0;
    M.boxR(a0, a1, yr, yr + t, z, z + 1.0 * s, MAT.METAL);
    for (let a = a0; a <= a1 + 0.01; a += 4.0 * s)
      M.boxR(a, a + postT, y0, y1, z, z + fh * s * 0.98, MAT.CONCRETE);
  } else {
    const x0 = face === "right" ? plane : plane - depth, x1 = face === "right" ? plane + depth : plane;
    M.boxR(x0, x1, a0, a1, z, z + slabT, MAT.CONCRETE);
    const xr = face === "right" ? x1 - t : x0;
    M.boxR(xr, xr + t, a0, a1, z, z + 1.0 * s, MAT.METAL);
    for (let a = a0; a <= a1 + 0.01; a += 4.0 * s)
      M.boxR(x0, x1, a, a + postT, z, z + fh * s * 0.98, MAT.CONCRETE);
  }
  if (withAC) for (let a = a0 + 1.6 * s; a < a1; a += 3.6 * s)
    if (chance(rng, 0.6)) acBox(M, face, a + (rng() - 0.5) * 0.4 * s, z + slabT, s);
  if (clutter && chance(rng, 0.7)) {                                    // futon / laundry on the rail
    const la = a0 + 2.0 * s + rng() * Math.max(0.1, a1 - a0 - 4.0 * s);
    const yb = face === "front" ? plane + depth : plane - depth;
    if (face === "front" || face === "back")
      M.boxR(la, la + 0.4 * s, yb, yb + Math.max(1, 0.1 * s), z + 0.7 * s, z + 1.2 * s, pick(rng, [MAT.WHITE, MAT.NBLUE, MAT.NPINK]));
    else
      M.boxR(yb, yb + Math.max(1, 0.1 * s), la, la + 0.4 * s, z + 0.7 * s, z + 1.2 * s, pick(rng, [MAT.WHITE, MAT.NBLUE, MAT.NPINK]));
  }
}

// periodic balcony slabs + railing on a facade (optional per-unit AC)
function balconyStrip(M, face, a0, a1, z, s, fh, unitM, withAC, rng) {
  const mid = (a0 + a1) / 2;
  const plane = facePlane(M, face, mid, z + Math.max(1, 0.3 * s));
  if (plane < 0) return;
  const depth = Math.max(1, 1.3 * s), t = Math.max(1, 0.1 * s), slabT = Math.max(1, 0.22 * s);
  const unit = Math.max(2 * s, unitM * s);
  const n = Math.max(1, Math.floor((a1 - a0) / unit));
  const off = (a1 - a0 - n * unit) / 2;
  for (let i = 0; i < n; i++) {
    const ua = a0 + off + i * unit + 0.15 * s, ub = a0 + off + (i + 1) * unit - 0.15 * s;
    if (face === "front" || face === "back") {
      const y0 = face === "front" ? plane : plane - depth, y1 = face === "front" ? plane + depth : plane;
      M.boxR(ua, ub, y0, y1, z, z + slabT, MAT.CONCRETE);
      const yr = face === "front" ? y1 - t : y0;
      M.boxR(ua, ub, yr, yr + t, z, z + 1.0 * s, MAT.METAL);
      if (withAC && chance(rng, 0.7)) acBox(M, face, (ua + ub) / 2, z + slabT, s);
    } else {
      const x0 = face === "right" ? plane : plane - depth, x1 = face === "right" ? plane + depth : plane;
      M.boxR(x0, x1, ua, ub, z, z + slabT, MAT.CONCRETE);
      const xr = face === "right" ? x1 - t : x0;
      M.boxR(xr, xr + t, ua, ub, z, z + 1.0 * s, MAT.METAL);
      if (withAC && chance(rng, 0.7)) acBox(M, face, (ua + ub) / 2, z + slabT, s);
    }
  }
}

// rooftop sign frame (屋上サイン架): two steel posts + framed panel above the roof
function roofSignFrame(M, cx, cy, zBase, halfW, s, neon, rng) {
  const h = Math.max(2, 2.8 * s), postT = Math.max(1, 0.16 * s), th = Math.max(1, 0.18 * s);
  const y0 = cy - th / 2, y1 = cy + th / 2;
  M.boxR(cx - halfW, cx - halfW + postT, y0, y1, zBase, zBase + h, MAT.STEEL);
  M.boxR(cx + halfW - postT, cx + halfW, y0, y1, zBase, zBase + h, MAT.STEEL);
  M.boxR(cx - halfW, cx + halfW, y0, y1, zBase + 0.3 * s, zBase + 0.45 * s, MAT.STEEL);
  M.boxR(cx - halfW + 0.25 * s, cx + halfW - 0.25 * s, y0, y1, zBase + 0.45 * s, zBase + 0.7 * s, MAT.ALU);
  M.boxR(cx - halfW + 0.35 * s, cx + halfW - 0.35 * s, y0, y1, zBase + 0.7 * s, zBase + h - 0.15 * s, MAT.SIGN);
  if (neon) M.boxR(cx - halfW + 0.35 * s, cx + halfW - 0.35 * s, y0, y1,
    zBase + 0.7 * s, zBase + 0.7 * s + Math.max(1, 0.12 * s), pick(rng, NEONS));
}

// institutional red-cross sign panel above the entrance (病院サイン)
function redCrossSign(M, face, aC, z0, s) {
  const w = Math.max(3, 2.9 * s), h = w, arm = Math.max(1, 0.72 * s);
  const a0 = aC - w / 2, a1 = aC + w / 2, za = z0, zb = z0 + h;
  paintFace(M, face, a0, a1, za, zb, MAT.SIGN, 2);
  paintFace(M, face, aC - arm / 2, aC + arm / 2, za + Math.max(1, 0.35 * s), zb - Math.max(1, 0.35 * s), MAT.NRED, 2);
  paintFace(M, face, a0 + Math.max(1, 0.35 * s), a1 - Math.max(1, 0.35 * s),
    (za + zb) / 2 - arm / 2, (za + zb) / 2 + arm / 2, MAT.NRED, 2);
}

// rooftop helipad: dark pad disc + white ring + red "H"
function helipad(M, cx, cy, z, r, s) {
  if (r < 2) return;
  const zz = Math.round(z);
  M.cylZ(cx, cy, zz, zz, r, r, MAT.ROOF);
  M.cylZ(cx, cy, zz + 1, zz + 1, r * 0.92, r * 0.92, MAT.WHITE);
  const t = Math.max(1, 0.18 * s), hh = Math.max(1, r * 0.42), gap = Math.max(1, r * 0.26);
  M.boxR(cx - gap - t, cx - gap, cy - hh, cy + hh, zz + 2, zz + 2, MAT.NRED);
  M.boxR(cx + gap, cx + gap + t, cy - hh, cy + hh, zz + 2, zz + 2, MAT.NRED);
  M.boxR(cx - gap, cx + gap, cy - Math.max(1, t / 2), cy + Math.max(1, t / 2), zz + 2, zz + 2, MAT.NRED);
}

// louvered equipment-floor band (設備層): metal panel with vertical louvre fins
function louverBand(M, face, a0, a1, z0, z1, s) {
  if (z1 <= z0) return;
  paintFace(M, face, a0, a1, z0, z1, MAT.METAL, 2);
  const du = Math.max(1, 0.7 * s);
  for (let a = a0; a <= a1 + 0.01; a += du)
    paintFace(M, face, a, a + Math.max(1, 0.12 * s), z0, z1, MAT.STEEL, 2);
}

// rooftop / ground parking deck: asphalt slab + white bays + parked cars + railing
function parkingDeck(M, cx, cy, hw, hd, z, s, rng) {
  const zz = Math.round(z), slabT = Math.max(1, 0.14 * s);
  M.boxR(cx - hw, cx + hw, cy - hd, cy + hd, zz, zz + slabT, MAT.ASPHALT);
  railing(M, cx - hw, cx + hw, cy - hd, cy + hd, zz + slabT, s, 0.9);
  const t = Math.max(1, 0.12 * s), lz = zz + slabT;
  for (let x = cx - hw + 1.4 * s; x < cx + hw - 0.4 * s; x += 2.8 * s) {
    M.boxR(x, x + t, cy - hd + 0.5 * s, cy + hd - 0.5 * s, lz, lz, MAT.WHITE);
    if (chance(rng, 0.55))
      M.boxC(x + 1.0 * s, cy + (rng() < 0.5 ? -1 : 1) * hd * 0.4, lz + 0.4 * s,
        0.55 * s, 0.9 * s, 0.3 * s, pick(rng, [MAT.WHITE, MAT.BLACK, MAT.ALU, MAT.METAL]));
  }
}

// ---------------------------------------------------------------- OFFICE forms
function officeForm(M, p, rng, s, cx, cy, hwM, hdM) {
  const fh = fhOf(p), floors = p.floors, bodyH = floors * fh;
  const hw = hwM * s, hd = hdM * s;

  if (p.form === "O1") { // ---- Pencil ペンシルビル
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    const lobbyH = p.lobby ? Math.min(3.4, fh * 0.95) : 0;
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      curtainWall(M, face, a0, a1, lobbyH * s, bodyH * s, s, p.density, fh, rng);
    }
    if (p.lobby) shopFront(M, cx, hw, s, fh, rng, true);
    externalStair(M, s, cx, cy, hwM, hdM, floors, fh);
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  if (p.form === "O2") { // ---- Setback 斜線ビル (sky-exposure plane wedge)
    const side = chance(rng, 0.5) ? 1 : 0; // also step the right side for a corner wedge
    let topHw = hwM, topHd = hdM, topCy = cy;
    for (let f = 0; f < floors; f++) {
      const setF = Math.max(0, f - 2) * 0.55;          // front setback per floor above 2F
      const setS = side ? Math.max(0, f - 4) * 0.35 : 0;
      const hdF = hd - setF * s / 2, cyF = cy - setF * s / 2;
      const x1 = cx + hw - setS * s;
      M.boxR(cx - hw, x1, cyF - hdF, cyF + hdF, f * fh * s, (f + 1) * fh * s, MAT.BODY);
      if (f >= 2) { // railing on the exposed setback strip
        const yFront = cyF + hdF;
        M.boxR(cx - hw, x1, yFront - Math.max(1, 0.1 * s), yFront, (f + 1) * fh * s, (f + 1) * fh * s + 0.9 * s, MAT.METAL);
      }
      topHw = (x1 - (cx - hw)) / 2 / s; topHd = hdF / s; topCy = cyF;
    }
    const topCx = (cx - hw + cx + hw - (side ? Math.max(0, floors - 1 - 4) * 0.35 : 0) * s) / 2;
    for (let f = 0; f < floors; f++) {
      const setF = Math.max(0, f - 2) * 0.55, setS = side ? Math.max(0, f - 4) * 0.35 : 0;
      const hdF = hd - setF * s / 2, cyF = cy - setF * s / 2, x1 = cx + hw - setS * s;
      const ranges = { front: [cx - hw, x1], back: [cx - hw, x1], left: [cyF - hdF, cyF + hdF], right: [cyF - hdF, cyF + hdF] };
      for (const face of FACES) {
        const [a0, a1] = ranges[face];
        if (p.tileFacade) tileTexture(M, face, a0, a1, f * fh * s, (f + 1) * fh * s, s);
        punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, f * fh * s, 1, fh, s, p.density, rng);
      }
    }
    if (p.lobby) shopFront(M, cx, hw, s, fh, rng, false);
    return { cx: topCx, cy: topCy, hwM: topHw, hdM: topHd, zM: bodyH };
  }

  if (p.form === "O3") { // ---- Grid 都庁風 (granite + glass vertical stripes, optional twins)
    const twin = chance(rng, 0.4);
    const shafts = [];
    if (twin) {
      M.boxC(cx, cy, fh * s, hw, hd, fh * s, MAT.BODY); // 2F podium
      const sw = hw * 0.42, off = hw * 0.52;
      shafts.push({ cx: cx - off, hw: sw }, { cx: cx + off, hw: sw });
      for (const sh of shafts) M.boxC(sh.cx, cy, (2 * fh + (bodyH - 2 * fh) / 2) * s, sh.hw, hd * 0.9, (bodyH - 2 * fh) * s / 2, MAT.BODY);
      const bz = Math.round(floors * 0.6) * fh * s;   // skybridge
      M.boxR(cx - off, cx + off, cy - hd * 0.35, cy + hd * 0.35, bz, bz + 2 * fh * s, MAT.BODY);
    } else {
      M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
      shafts.push({ cx, hw });
    }
    for (const sh of shafts) {
      const z0 = twin ? 2 * fh * s : 0;
      const crownZ = bodyH * s - (p.crown ? 2 : 1) * fh * s;
      for (const face of FACES) {
        const [a0, a1] = faceRange(face, sh.cx, cy, sh.hw, hd * (twin ? 0.9 : 1));
        paintFace(M, face, a0, a1, z0, bodyH * s, MAT.GLASS, 2);
        const du = 1.5 * s, pierW = 0.7 * s;            // dense granite piers
        for (let a = a0; a <= a1 + 0.01; a += du) paintFace(M, face, a, a + pierW, z0, bodyH * s, MAT.BODY, 2);
        for (let z = z0; z <= bodyH * s; z += 3 * fh * s) paintFace(M, face, a0, a1, z, z + Math.max(1, 0.4 * s), MAT.FRAME, 2);
        paintFace(M, face, a0, a1, crownZ, bodyH * s, MAT.FRAME, 2); // strong crown band
      }
      if (p.crown) M.boxC(sh.cx, cy, bodyH * s - fh * s / 2, sh.hw * 0.85, hd * 0.8, fh * s / 2, MAT.BODY);
    }
    if (p.lobby) shopFront(M, cx, hw, s, fh, rng, false);
    return { cx, cy, hwM: twin ? hw * 0.42 : hwM, hdM: hdM * (twin ? 0.9 : 1), zM: bodyH, twin };
  }

  if (p.form === "O4") { // ---- Cocoon コクーン (bulging taper + diagrid)
    const bh = bodyH * s;
    for (let z = 0; z <= bh; z++) {
      const t = z / bh;
      const sc = 0.62 + 0.38 * Math.pow(Math.sin(Math.PI * t), 0.85);
      M.cylZ(cx, cy, z, z, hw * sc, hd * sc, MAT.BODY);
    }
    const P = 3 * s, ribW = Math.max(1, 0.28 * s);
    const W = M.W, D = M.D, mat = M.mat, WD = W * D;
    for (let z = 0; z <= bh; z++) {
      const base = z * WD;
      for (let y = 0; y < D; y++) {
        const row = base + y * W;
        for (let x = 0; x < W; x++) {
          const i = row + x;
          if (!mat[i]) continue;
          const per = (x === 0 || x === W - 1 || y === 0 || y === D - 1 ||
            !mat[i - 1] || !mat[i + 1] || !mat[i - W] || !mat[i + W]);
          if (!per) continue;
          const u = ((x + y + z) % P + P) % P, v = ((x - y + z) % P + P) % P;
          const m = (u < ribW || v < ribW) ? MAT.FRAME : MAT.GLASS;
          mat[i] = m;
          if (x > 0 && mat[i - 1] && mat[i - 1] !== m) mat[i - 1] = m;
          if (x < W - 1 && mat[i + 1] && mat[i + 1] !== m) mat[i + 1] = m;
          if (y > 0 && mat[i - W] && mat[i - W] !== m) mat[i - W] = m;
          if (y < D - 1 && mat[i + W] && mat[i + W] !== m) mat[i + W] = m;
        }
      }
    }
    if (p.lobby) shopFront(M, cx, hw * 0.62, s, fh, rng, false);
    ringPaint(M, bh - 1 * s, bh, MAT.FRAME);
    return { cx, cy, hwM: hwM * 0.62, hdM: hdM * 0.62, zM: bodyH, round: true };
  }

  // ================= ordinary everyday offices (rectangular, flat roofs) =================
  if (p.form === "O6") { // ---- Standard 标准办公: tile/concrete + regular punched windows + spandrels
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    const lobbyH = p.lobby ? Math.min(4.2, fh * 1.2) : 0;
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, lobbyH * s, bodyH * s, s);
      punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, fh * s, floors - 1, fh, s, p.density, rng);
      spandrelBands(M, face, a0, a1, fh * s, bodyH * s, fh, s);
    }
    if (p.lobby) {
      paintFace(M, "front", cx - hw + 0.4 * s, cx + hw - 0.4 * s, 0.3 * s, lobbyH * s, MAT.GLASS_W, 2);
      paintFace(M, "front", cx - 1 * s, cx + 1 * s, 0.3 * s, 2.6 * s, MAT.GLASS, 2);
      const plane = facePlane(M, "front", cx, 3 * s);
      if (plane >= 0) M.boxR(cx - 2.5 * s, cx + 2.5 * s, plane, plane + 1.2 * s, 3.6 * s, 3.8 * s, MAT.ALU);
    }
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  if (p.form === "O7") { // ---- Tenant 雑居ビル: narrow multi-tenant, vertical sign, optional stair, shop
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, fh * s, bodyH * s, s);
      punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, fh * s, floors - 1, fh, s, p.density, rng);
      spandrelBands(M, face, a0, a1, fh * s, bodyH * s, fh, s);
    }
    if (p.lobby) shopFront(M, cx, hw, s, fh, rng, true);
    if (chance(rng, 0.6)) externalStair(M, s, cx, cy, hwM, hdM, floors, fh);
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  if (p.form === "O8") { // ---- Glass box 玻璃盒子: uniform curtain-wall mullion grid, minimal ornament
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    const lobbyH = p.lobby ? Math.min(3.6, fh) : 0;
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      curtainWall(M, face, a0, a1, lobbyH * s, bodyH * s, s, "dense", fh, rng);
    }
    if (p.lobby) {
      paintFace(M, "front", cx - hw + 0.4 * s, cx + hw - 0.4 * s, 0.3 * s, lobbyH * s, MAT.GLASS_W, 2);
      paintFace(M, "front", cx - 1 * s, cx + 1 * s, 0.3 * s, 2.6 * s, MAT.GLASS, 2);
    }
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  if (p.form === "O9") { // ---- Low-rise 低层办公: 3-5F tile block, rooftop AC row + railing, small sign
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, 0, bodyH * s, s);
      punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, 0, floors, fh, s, p.density, rng);
    }
    paintFace(M, "front", cx - 0.9 * s, cx + 0.9 * s, 0.3 * s, 2.4 * s, MAT.GLASS_W, 2); // entrance
    const plane = facePlane(M, "front", cx, 2.6 * s);
    if (plane >= 0) M.boxR(cx - 1.6 * s, cx + 1.6 * s, plane, plane + 0.2 * s, 2.6 * s, 3.0 * s, MAT.SIGN);
    const rz = bodyH * s;                                                                  // flat roof: AC row + railing
    M.boxR(cx - hw, cx + hw, cy - hd, cy + hd, rz, rz + Math.max(1, 0.15 * s), MAT.ROOF_M);
    railing(M, cx - hw, cx + hw, cy - hd, cy + hd, rz + 0.15 * s, s, 0.9);
    for (let a = cx - hw + 1 * s; a < cx + hw - 0.5 * s; a += 1.6 * s)
      M.boxC(a, cy - hd + 1 * s, rz + 0.5 * s, 0.5 * s, 0.4 * s, 0.35 * s, MAT.WHITE);
    return { cx, cy, hwM, hdM, zM: bodyH, acRoof: true };
  }

  if (p.form === "O10") { // ---- Ribbon 带窗办公: aluminum cladding + continuous horizontal ribbon glazing
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      for (let f = 0; f < floors; f++) {
        const zb = f * fh * s;
        paintFace(M, face, a0, a1, zb + 1.0 * s, zb + (fh - 0.6) * s, MAT.GLASS, 2);      // ribbon band
        paintFace(M, face, a0, a1, zb + 0.9 * s, zb + 1.0 * s, MAT.FRAME, 2);            // sill line
        paintFace(M, face, a0, a1, zb + (fh - 0.6) * s, zb + (fh - 0.5) * s, MAT.FRAME, 2);
      }
    }
    if (p.lobby) paintFace(M, "front", cx - hw + 0.4 * s, cx + hw - 0.4 * s, 0.3 * s, 2.8 * s, MAT.GLASS_W, 2);
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  if (p.form === "O11") { // ---- Terrace setback 階段状テラス: chunky tiered mid-rise with roof terraces
    const nT = Math.max(2, Math.min(3, Math.floor(floors / 3)));
    const base = Math.floor(floors / nT);
    let zF = 0, topHw = hwM, topHd = hdM;
    for (let t = 0; t < nT; t++) {
      const fCount = t === nT - 1 ? floors - zF : base;
      if (fCount <= 0) break;
      const tw = Math.max(0.5 * hwM, hwM - t * Math.min(1.5, hwM * 0.11));
      const td = Math.max(0.5 * hdM, hdM - t * Math.min(1.3, hdM * 0.11));
      const z0 = zF * fh * s, z1 = (zF + fCount) * fh * s;
      M.boxC(cx, cy, (z0 + z1) / 2, tw * s, td * s, (z1 - z0) / 2, MAT.BODY);
      for (const face of FACES) {
        const [a0, a1] = faceRange(face, cx, cy, tw * s, td * s);
        if (p.tileFacade) tileTexture(M, face, a0, a1, z0, z1, s, 1.6);
        punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, z0, fCount, fh, s, p.density, rng);
        spandrelBands(M, face, a0, a1, z0, z1, fh, s);
      }
      if (p.lobby && t === 0) shopFront(M, cx, tw * s, s, fh, rng, true);
      if (p.balconies) for (let f = 1; f < fCount; f++)            // office balconies on the terrace tiers
        balconyStrip(M, "front", cx - tw * s, cx + tw * s, (zF + f) * fh * s, s, fh, 3.6, p.ac, rng);
      if (t < nT - 1) {                                   // planted roof terrace at every setback
        terrace(M, cx, cy, tw * s, td * s, z1, s, p.garden, rng, MAT.ROOF);
        if (p.acUnits) {
          const [ta0, ta1] = faceRange("front", cx, cy, tw * s, td * s);
          for (let a = ta0 + 1.5 * s; a < ta1; a += 2.6 * s)
            if (chance(rng, 0.7)) M.boxC(a, cy - td * s * 0.55, z1 + 0.4 * s, 0.5 * s, 0.4 * s, 0.3 * s, MAT.WHITE);
        }
        if (p.neon) paintFace(M, "front", cx - tw * s, cx + tw * s, z1 - Math.max(1, 0.2 * s), z1, MAT.ACCENT, 2);
      }
      zF += fCount; topHw = tw; topHd = td;
    }
    return { cx, cy, hwM: topHw, hdM: topHd, zM: bodyH };
  }

  if (p.form === "O12") { // ---- Curtain wall ガラスカーテン: all-glass skin + vertical fins
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    const lobbyH = p.lobby ? Math.min(4.6, fh * 1.25) : 0;
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      paintFace(M, face, a0, a1, lobbyH * s, bodyH * s, MAT.GLASS, 2);
      for (let f = 1; f * fh * s <= bodyH * s; f++)   // recessed floor lines
        paintFace(M, face, a0, a1, f * fh * s - Math.max(1, 0.08 * s), f * fh * s + Math.max(1, 0.08 * s), MAT.FRAME, 2);
      for (let a = a0; a <= a1 + 0.01; a += 1.4 * s)  // dense flat mullions
        paintFace(M, face, a, a + Math.max(1, 0.09 * s), lobbyH * s, bodyH * s, MAT.FRAME, 2);
    }
    if (p.balconies) for (let f = 1; f < floors; f++)   // glass-tower floor balconies
      balconyStrip(M, "front", cx - hw + 0.4 * s, cx + hw - 0.4 * s, f * fh * s, s, fh, 4.2, p.ac, rng);
    for (const face of FACES) {                        // projecting alu fins (double-skin read)
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      const t = Math.max(1, 0.22 * s);
      for (let a = a0 + 2.1 * s; a <= a1; a += 4.2 * s) {
        const plane = facePlane(M, face, a, bodyH * s * 0.5);
        if (plane < 0) continue;
        if (face === "front") M.boxR(a - t / 2, a + t / 2, plane, plane + 0.45 * s, lobbyH * s, bodyH * s, MAT.ALU);
        else if (face === "back") M.boxR(a - t / 2, a + t / 2, plane - 0.45 * s, plane, lobbyH * s, bodyH * s, MAT.ALU);
        else if (face === "right") M.boxR(plane, plane + 0.45 * s, a - t / 2, a + t / 2, lobbyH * s, bodyH * s, MAT.ALU);
        else M.boxR(plane - 0.45 * s, plane, a - t / 2, a + t / 2, lobbyH * s, bodyH * s, MAT.ALU);
      }
    }
    if (p.lobby) {
      paintFace(M, "front", cx - hw + 0.4 * s, cx + hw - 0.4 * s, 0.35 * s, lobbyH * s, MAT.GLASS_W, 2);
      canopyBand(M, "front", cx - hw + 0.3 * s, cx + hw - 0.3 * s, lobbyH * s, s, 1.6, MAT.ALU);
    }
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  if (p.form === "O13") { // ---- Shop-office 店舗併用ビル: 1–2F shops below small offices
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    const shopF = Math.min(2, Math.max(1, floors - 1)), shopTop = shopF * fh * s;
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, shopTop, bodyH * s, s, 1.6);
      punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, shopTop, floors - shopF, fh, s, p.density, rng);
      spandrelBands(M, face, a0, a1, shopTop, bodyH * s, fh, s);
    }
    if (p.lobby) {                                     // ground-floor shops with awning + sign band
      shopFront(M, cx, hw, s, fh, rng, true);
      if (shopF > 1) {                                  // 2F showroom band
        const z = fh * s;
        paintFace(M, "front", cx - hw + 0.4 * s, cx + hw - 0.4 * s, z + 0.4 * s, z + Math.min(2.6, fh - 0.5) * s, MAT.GLASS_W, 2);
        canopyBand(M, "front", cx - hw + 0.2 * s, cx + hw - 0.2 * s, (shopF) * fh * s, s, 1.3, MAT.ALU);
      }
    } else {
      punchedWindows(M, "front", cx - hw + 0.4 * s, cx + hw - 0.4 * s, 0, floors, fh, s, p.density, rng);
    }
    if (p.balconies) for (let f = 2; f < floors; f++)    // small office balconies above the shops
      balconyStrip(M, "front", cx - hw + 0.3 * s, cx + hw - 0.3 * s, f * fh * s, s, fh, 3.2, p.ac, rng);
    const rz = bodyH * s;                              // roof: AC row + railing + tank
    railing(M, cx - hw, cx + hw, cy - hd, cy + hd, rz + 0.15 * s, s, 0.9);
    if (p.acUnits) for (let a = cx - hw + 1.0 * s; a < cx + hw - 0.5 * s; a += 1.8 * s)
      M.boxC(a, cy - hd + 1.0 * s, rz + 0.4 * s, 0.45 * s, 0.35 * s, 0.3 * s, MAT.WHITE);
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  if (p.form === "O14") { // ---- Twin towers ツインタワー: podium + two towers + skybridge
    const podF = Math.max(1, Math.min(2, floors - 3)), podH = podF * fh;
    M.boxC(cx, cy, podH * s / 2, hw, hd, podH * s / 2, MAT.BODY);
    if (p.lobby) shopFront(M, cx, hw, s, fh, rng, false);
    const gap = Math.max(2.4 * s, hw * 0.2);
    const towHalf = (2 * hw - gap) / 4;
    const off = gap / 2 + towHalf;
    const td = hd * 0.82, towerF = floors - podF;
    for (const sgn of [-1, 1]) {
      const tcx = cx + sgn * off;
      M.boxC(tcx, cy, (podH + bodyH) * s / 2, towHalf, td, (bodyH - podH) * s / 2, MAT.BODY);
      for (const face of FACES) {
        const [a0, a1] = faceRange(face, tcx, cy, towHalf, td);
        if (p.tileFacade) tileTexture(M, face, a0, a1, podH * s, bodyH * s, s, 1.6);
        curtainWall(M, face, a0, a1, podH * s, bodyH * s, s, p.density, fh, rng);
      }
      if (p.balconies) for (let f = podF; f < floors; f++)      // tower balconies
        balconyStrip(M, "front", tcx - towHalf + 0.4 * s, tcx + towHalf - 0.4 * s, f * fh * s, s, fh, 3.4, p.ac, rng);
    }
    const bz = Math.round((podH + towerF * fh * 0.58) * s);
    const bh = Math.min(2 * fh, 7) * s;
    M.boxR(cx - off - towHalf + 1, cx + off + towHalf - 1, cy - td * 0.34, cy + td * 0.34, bz, bz + bh, MAT.BODY);
    for (const face of ["front", "back"]) {
      paintFace(M, face, cx - gap / 2 + 0.3 * s, cx + gap / 2 - 0.3 * s, bz + 0.3 * s, bz + bh - 0.3 * s, MAT.GLASS, 2);
    }
    return { cx: cx + off, cy, hwM: towHalf / s, hdM: td / s, zM: bodyH, twin: true };
  }

  // ---- O5 Capsule 中銀カプセル (twin cores + plug-in capsules, round windows)
  const coreHalf = 1.4 * s, coreOff = hw * 0.45;
  const cores = [cx - coreOff, cx + coreOff];
  for (const ccx of cores) M.boxC(ccx, cy, bodyH * s / 2, coreHalf, coreHalf, bodyH * s / 2, MAT.CONCRETE);
  const cw = 2.5 * s, cd = 2.6 * s, chh = 2.4 * s, levelH = 2.6 * s;
  const levels = Math.floor(bodyH * s / levelH);
  const r = 0.55 * s;
  for (let L = 0; L < levels; L++) {
    const z = L * levelH + 0.15 * s;
    for (let ci = 0; ci < cores.length; ci++) {
      const ccx = cores[ci];
      const faces = [
        { face: "front", a: ccx, plane: cy + coreHalf + cd, dir: 1 },
        { face: "back", a: ccx, plane: cy - coreHalf - cd, dir: -1 },
      ];
      if (ci === 0) faces.push({ face: "left", a: cy, plane: ccx - coreHalf - cd, dir: -1 });
      if (ci === 1) faces.push({ face: "right", a: cy, plane: ccx + coreHalf + cd, dir: 1 });
      for (const f of faces) {
        if (chance(rng, 0.08)) continue; // empty socket (derelict variety)
        const jx = (rng() - 0.5) * 0.12 * s, jz = (rng() - 0.5) * 0.1 * s;
        if (f.face === "front" || f.face === "back") {
          const y0 = f.face === "front" ? cy + coreHalf : f.plane;
          const y1 = f.face === "front" ? f.plane : cy - coreHalf;
          M.boxR(f.a - cw / 2 + jx, f.a + cw / 2 + jx, y0, y1, z + jz, z + chh + jz, MAT.WHITE);
          roundWindow(M, f.face, f.a + jx, z + chh / 2 + jz, f.plane, r, s);
        } else {
          const x0 = f.face === "right" ? ccx + coreHalf : f.plane;
          const x1 = f.face === "right" ? f.plane : ccx - coreHalf;
          M.boxR(x0, x1, f.a - cw / 2 + jx, f.a + cw / 2 + jx, z + jz, z + chh + jz, MAT.WHITE);
          roundWindow(M, f.face, f.a + jx, z + chh / 2 + jz, f.plane, r, s);
        }
      }
    }
  }
  return { cx, cy, hwM: coreOff / s + 1.6, hdM: coreHalf / s + 0.6, zM: bodyH };
}

// ---------------------------------------------------------------- RESIDENTIAL forms
function resForm(M, p, rng, s, cx, cy, hwM, hdM) {
  const fh = fhOf(p), floors = p.floors, bodyH = floors * fh;
  const hw = hwM * s, hd = hdM * s;

  if (p.form === "R1") { // ---- Mansion マンション
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, fh * s, bodyH * s, s);
    }
    // sliding glass doors behind balconies (front/back), punched windows on sides
    for (const face of ["front", "back"]) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      const unit = 3.4 * s;
      for (let f = 1; f < floors; f++)
        for (let a = a0 + unit / 2; a < a1; a += unit)
          paintFace(M, face, a - 0.9 * s, a + 0.9 * s, f * fh * s + 0.2 * s, f * fh * s + 2.2 * s, MAT.GLASS_W, 2);
    }
    for (const face of ["left", "right"]) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, fh * s, floors - 1, fh, s, p.density, rng);
    }
    if (p.lobby) shopFront(M, cx, hw, s, fh, rng, false);
    else punchedWindows(M, "front", cx - hw + 0.4 * s, cx + hw - 0.4 * s, 0, 1, fh, s, p.density, rng);
    if (p.balconies) {
      for (let f = 1; f < floors; f++) {
        mansionBalcony(M, "front", cx - hw, cx + hw, f * fh * s, s, fh, 3.4, p.ac, rng);
        mansionBalcony(M, "back", cx - hw, cx + hw, f * fh * s, s, fh, 3.4, p.ac, rng);
      }
    }
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  if (p.form === "R2") { // ---- Apaato アパート (2-3F, external stair, open corridor, gable)
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    M.gable(cx, cy, bodyH * s, hw + 0.4 * s, hd + 0.4 * s, 1.1 * s, MAT.ROOF, "x");
    // doors + windows per unit on each floor
    const unit = 3.0 * s;
    for (let f = 0; f < floors; f++) {
      const z = f * fh * s;
      for (let a = cx - hw + unit / 2; a < cx + hw; a += unit) {
        paintFace(M, "front", a - 0.45 * s, a + 0.45 * s, z + 0.2 * s, z + 2.0 * s, MAT.WOOD, 2);   // door
        paintFace(M, "front", a + 0.7 * s, a + 1.4 * s, z + 0.9 * s, z + 2.0 * s, MAT.GLASS, 2);  // window
        paintFace(M, "back", a - 0.7 * s, a + 0.7 * s, z + 0.9 * s, z + 2.0 * s, MAT.GLASS, 2);
      }
    }
    // open corridor (開放廊下) on upper floors + railing
    for (let f = 1; f < floors; f++) {
      const z = f * fh * s, plane = facePlane(M, "front", cx, z + 0.3 * s);
      if (plane < 0) continue;
      M.boxR(cx - hw, cx + hw, plane, plane + 1.2 * s, z, z + Math.max(1, 0.2 * s), MAT.CONCRETE);
      M.boxR(cx - hw, cx + hw, plane + 1.2 * s - Math.max(1, 0.1 * s), plane + 1.2 * s, z, z + 1.0 * s, MAT.METAL);
      for (let a = cx - hw + unit / 2; a < cx + hw; a += unit) if (chance(rng, 0.6)) acBox(M, "front", a, z + 0.2 * s, s);
      if (p.rooftopClutter && chance(rng, 0.7)) { // laundry on the corridor rail
        const lx = cx + (rng() - 0.5) * hw;
        M.boxR(lx, lx + 0.4 * s, plane + 1.1 * s, plane + 1.2 * s, z + 1.0 * s, z + 1.4 * s, pick(rng, [MAT.WHITE, MAT.NBLUE, MAT.NPINK]));
      }
    }
    // external steel stair at the left end
    const runLen = 3.2 * s, prot = 1.2 * s, n = 8, rise = fh * s / n, run = runLen / n;
    const xStart = cx - hw + 0.5 * s;
    const yw = facePlane(M, "front", xStart, fh * s / 2);
    if (yw >= 0) {
      for (let i = 0; i < n; i++) {
        M.boxR(xStart + i * run, xStart + (i + 1) * run, yw, yw + prot, 0, (i + 1) * rise, MAT.STEEL);
        M.boxR(xStart + i * run, xStart + (i + 1) * run, yw + prot - Math.max(1, 0.1 * s), yw + prot, (i + 1) * rise, (i + 1) * rise + 1.0 * s, MAT.METAL);
      }
      M.boxR(xStart + runLen, xStart + runLen + 0.8 * s, yw, yw + prot, fh * s - 0.2 * s, fh * s, MAT.STEEL);
    }
    // entrance lantern + planters
    const plane0 = facePlane(M, "front", cx - hw + 1.5 * s, 1.5 * s);
    if (plane0 >= 0) M.boxC(cx - hw + 1.5 * s, plane0 + 0.3 * s, 2.3 * s, 0.2 * s, 0.2 * s, 0.3 * s, MAT.NRED);
    for (let i = 0; i < 3; i++) planter(M, cx - hw + (1 + i * 2.5) * s, cy + hd + 0.8 * s, 0, s);
    return { cx, cy, hwM, hdM, zM: bodyH + 1.1, gable: true };
  }

  if (p.form === "R4") { // ---- Low mansion 低層マンション: 3–5F, continuous balconies, set-back top floor
    const topF = Math.max(1, Math.min(2, floors - 1)), mainF = floors - topF;
    M.boxC(cx, cy, mainF * fh * s / 2, hw, hd, mainF * fh * s / 2, MAT.BODY);
    const tw = hw * 0.78, td = hd * 0.82;
    M.boxC(cx, cy, (mainF * fh + bodyH) * s / 2, tw, td, topF * fh * s / 2, MAT.BODY);
    terrace(M, cx, cy, hw, hd, mainF * fh * s, s, p.garden, rng, MAT.ROOF);   // roof terrace ring
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, 0, mainF * fh * s, s, 1.5);
      punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, 0, mainF, fh, s, p.density, rng);
    }
    const [fa0, fa1] = faceRange("front", cx, cy, hw, hd);
    const unit = 3.8 * s;
    for (let f = 1; f < mainF; f++)                                    // balcony sliding doors
      for (let a = fa0 + unit / 2; a < fa1; a += unit)
        paintFace(M, "front", a - 1.0 * s, a + 1.0 * s, f * fh * s + 0.2 * s, f * fh * s + 2.2 * s, MAT.GLASS_W, 2);
    if (p.lobby) shopFront(M, cx, hw, s, fh, rng, false);
    else punchedWindows(M, "front", cx - hw + 0.4 * s, cx + hw - 0.4 * s, 0, 1, fh, s, p.density, rng);
    if (p.balconies) for (let f = 1; f < mainF; f++)
      mansionBalcony(M, "front", cx - hw, cx + hw, f * fh * s, s, fh, 3.8, p.ac, rng);
    if (p.balconies) for (let f = mainF; f < floors; f++)   // balconies on the set-back top floors
      balconyStrip(M, "front", cx - tw + 0.4 * s, cx + tw - 0.4 * s, f * fh * s, s, fh, 3.0, p.ac, rng);
    const py = facePlane(M, "front", cx, 1.6 * s);                     // entrance porch
    if (py >= 0) {
      M.boxR(cx - 2.4 * s, cx + 2.4 * s, py, py + 1.5 * s, 2.8 * s, 3.1 * s, MAT.ALU);
      M.boxR(cx - 2.2 * s, cx - 2.2 * s + Math.max(1, 0.18 * s), py + 1.2 * s, py + 1.5 * s, 0, 2.8 * s, MAT.STEEL);
      M.boxR(cx + 2.2 * s - Math.max(1, 0.18 * s), cx + 2.2 * s, py + 1.2 * s, py + 1.5 * s, 0, 2.8 * s, MAT.STEEL);
    }
    for (let i = 0; i < 3; i++) planter(M, cx - hw + (1 + i * 2.4) * s, cy + hd + 1.0 * s, 0, s);
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  if (p.form === "R5") { // ---- Open corridor 外廊下型: single-loaded corridor + end stairwell
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    for (const face of ["back", "left"]) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, 0, bodyH * s, s, 1.5);
      punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, 0, floors, fh, s, p.density, rng);
      bandLines(M, face, a0, a1, 0, bodyH * s, fh, s, 0.24, MAT.FRAME);
    }
    for (let f = 0; f < floors; f++) {                                 // front units behind the corridor
      const z = f * fh * s;
      for (let a = cx - hw + 1.6 * s; a < cx + hw - 1.0 * s; a += 3.4 * s) {
        paintFace(M, "front", a, a + 0.8 * s, z + 0.15 * s, z + 2.0 * s, MAT.WOOD, 2);
        paintFace(M, "front", a + 1.0 * s, a + 1.9 * s, z + 0.9 * s, z + 1.9 * s, MAT.GLASS, 2);
      }
      if (p.lobby && f === 0) {
        paintFace(M, "front", cx - 1.4 * s, cx + 1.4 * s, 0.2 * s, Math.min(2.4, fh * 0.8) * s, MAT.GLASS_W, 2);
        canopyBand(M, "front", cx - 2.2 * s, cx + 2.2 * s, fh * s, s, 1.2, MAT.ALU);
      }
      if (f > 0) openCorridor(M, "front", cx - hw, cx + hw, z, s, fh, p.ac, p.rooftopClutter, rng);
    }
    const coreW = Math.min(2.8 * s, hw * 0.8), coreP = 2.2 * s;        // end stairwell
    const x0 = cx - hw + 0.1 * s, x1 = x0 + coreW, y1 = cy + hd + coreP;
    M.boxR(x0, x1, cy + hd - 0.2 * s, y1, 0, bodyH * s + 1.5 * s, MAT.CONCRETE);
    for (let f = 0; f < floors; f++)
      paintFace(M, "front", x0 + 0.3 * s, x1 - 0.3 * s, f * fh * s + 0.6 * s,
        f * fh * s + Math.min(2.0, fh * 0.58) * s, MAT.GLASS, 2);
    M.boxR(x0 + 0.2 * s, x1 - 0.2 * s, y1 - Math.max(1, 0.1 * s), y1, bodyH * s, bodyH * s + 0.9 * s, MAT.METAL);
    if (p.balconies) for (let f = 1; f < floors; f++)
      balconyStrip(M, "back", cx - hw + 0.4 * s, cx + hw - 0.4 * s, f * fh * s, s, fh, 3.4, p.ac, rng);
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  if (p.form === "R6") { // ---- Stair riser 階段室型: walk-up block with protruding stair half-cells
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    for (const face of ["back", "left", "right"]) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, 0, bodyH * s, s, 1.5);
      punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, 0, floors, fh, s, p.density, rng);
      bandLines(M, face, a0, a1, 0, bodyH * s, fh, s, 0.22, MAT.FRAME);
    }
    const n = Math.max(2, Math.round((2 * hw) / (7.2 * s)));
    const step = (2 * hw) / n;
    for (let i = 0; i < n; i++) {
      const ac = cx - hw + step * (i + 0.5);
      const w = Math.min(2.6 * s, step * 0.55), prot = 1.9 * s;
      const x0 = ac - w / 2, x1 = ac + w / 2;
      M.boxR(x0, x1, cy + hd - 0.2 * s, cy + hd + prot, 0, bodyH * s + 0.9 * s, MAT.CONCRETE);
      for (let f = 0; f < floors; f++)
        paintFace(M, "front", x0 + 0.25 * s, x1 - 0.25 * s, f * fh * s + 0.7 * s,
          f * fh * s + Math.min(1.8, fh * 0.55) * s, MAT.GLASS, 2);
      M.boxR(x0 - 0.2 * s, x1 + 0.2 * s, cy + hd + prot - 0.1 * s, cy + hd + prot, bodyH * s + 0.5 * s, bodyH * s + 0.9 * s, MAT.METAL);
      if (i < n - 1) {                                  // unit windows between stair cells
        const ua = x1 + 0.5 * s, ub = x0 + step - 0.5 * s;
        for (let f = 0; f < floors; f++) {
          paintFace(M, "front", ua, ub, f * fh * s + 0.7 * s, f * fh * s + Math.min(2.0, fh * 0.6) * s, MAT.GLASS, 2);
          paintFace(M, "front", (ua + ub) / 2 - 0.35 * s, (ua + ub) / 2 + 0.35 * s, f * fh * s + 0.1 * s, f * fh * s + 1.9 * s, MAT.WOOD, 2);
        }
      }
    }
    if (p.lobby) {
      const half = Math.min(hw * 0.35, 2.6 * s);
      paintFace(M, "front", cx - half, cx + half, 0.3 * s, Math.min(2.5, fh * 0.8) * s, MAT.GLASS_W, 2);
      const py = facePlane(M, "front", cx, 1.5 * s);
      if (py >= 0) M.boxR(cx - 1.6 * s, cx + 1.6 * s, py, py + 1.8 * s, 2.6 * s, 2.9 * s, MAT.ALU);
    }
    if (p.balconies) for (let f = 1; f < floors; f++)
      balconyStrip(M, "back", cx - hw + 0.4 * s, cx + hw - 0.4 * s, f * fh * s, s, fh, 3.2, p.ac, rng);
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  if (p.form === "R7") { // ---- Shop mansion 店舗併用マンション: shops below, balconied flats above
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, fh * s, bodyH * s, s, 1.5);
      punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, fh * s, floors - 1, fh, s, p.density, rng);
      spandrelBands(M, face, a0, a1, fh * s, bodyH * s, fh, s);
    }
    if (p.lobby) {
      shopFront(M, cx, hw, s, fh, rng, true);
      const [fa0, fa1] = faceRange("front", cx, cy, hw, hd);
      for (let a = fa0 + 1.0 * s; a + 2.4 * s < fa1; a += 3.0 * s)      // extra shop bays + awnings
        paintFace(M, "front", a, a + 2.4 * s, 0.4 * s, Math.min(2.8, fh * 0.82) * s, MAT.GLASS_W, 2);
    } else {
      punchedWindows(M, "front", cx - hw + 0.4 * s, cx + hw - 0.4 * s, 0, 1, fh, s, p.density, rng);
    }
    const unit = 3.2 * s;
    for (let f = 1; f < floors; f++)
      for (let a = cx - hw + unit / 2; a < cx + hw; a += unit)
        paintFace(M, "front", a - 0.8 * s, a + 0.8 * s, f * fh * s + 0.2 * s, f * fh * s + 2.2 * s, MAT.GLASS_W, 2);
    if (p.balconies) for (let f = 1; f < floors; f++)
      mansionBalcony(M, "front", cx - hw, cx + hw, f * fh * s, s, fh, 3.2, p.ac, rng);
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  // ---- R3 Tower mansion タワーマンション (podium + balcony grid + crown)
  const podH = 2 * fh;
  M.boxC(cx, cy, podH * s / 2, hw, hd, podH * s / 2, MAT.BODY);
  if (p.lobby) shopFront(M, cx, hw, s, fh, rng, false);
  for (const face of ["back", "left", "right"]) {
    const [a0, a1] = faceRange(face, cx, cy, hw, hd);
    punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, 0, 2, fh, s, p.density, rng);
  }
  const tw = hw * 0.66, td = hd * 0.72, towerF = floors - 2;
  const crownF = p.crown ? 1 : 0, mainTF = towerF - crownF;
  M.boxC(cx, cy, (podH + mainTF * fh / 2) * s, tw, td, mainTF * fh * s / 2, MAT.BODY);
  for (const face of FACES) {
    const [a0, a1] = faceRange(face, cx, cy, tw, td);
    if (p.tileFacade) tileTexture(M, face, a0, a1, podH * s, (podH + mainTF * fh) * s, s);
    const unit = 2.8 * s;
    for (let f = 0; f < mainTF; f++)
      for (let a = a0 + unit / 2; a < a1; a += unit)
        paintFace(M, face, a - 0.8 * s, a + 0.8 * s, (podH + f * fh) * s + 0.2 * s, (podH + f * fh) * s + 2.2 * s, MAT.GLASS_W, 2);
  }
  if (p.balconies) {
    for (let f = 0; f < mainTF; f++) {
      const z = (podH + f * fh) * s;
      for (const face of FACES) {
        const [a0, a1] = faceRange(face, cx, cy, tw, td);
        mansionBalcony(M, face, a0, a1, z, s, fh, 2.8, p.ac, rng);
      }
    }
  }
  terrace(M, cx, cy, hw, hd, podH * s, s, p.garden, rng);
  let topH = bodyH, thw = tw / s, thd = td / s;
  if (crownF) {
    thw = tw / s * 0.82; thd = td / s * 0.82;
    terrace(M, cx, cy, tw, td, (podH + mainTF * fh) * s, s, p.garden, rng);
    M.boxC(cx, cy, (podH + mainTF * fh + fh / 2) * s, thw * s, thd * s, fh * s / 2, MAT.BODY);
    M.boxR(cx - thw * s, cx + thw * s, cy - thd * s, cy + thd * s, bodyH * s, bodyH * s + 0.5 * s, MAT.FRAME);
  }
  return { cx, cy, hwM: thw, hdM: thd, zM: topH };
}

// ---------------------------------------------------------------- HOTEL / DEPARTMENT / HOSPITAL / DANCHI forms
function hotelForm(M, p, rng, s, cx, cy, hwM, hdM) {
  const fh = fhOf(p), floors = p.floors, bodyH = floors * fh;
  const hw = hwM * s, hd = hdM * s;

  if (p.form === "HO1") { // ---- City hotel シティホテル: glass podium + banded guestroom tower + rooftop sign frame
    const podF = Math.max(1, Math.min(2, floors - 1)), podH = podF * fh;
    M.boxC(cx, cy, podH * s / 2, hw, hd, podH * s / 2, MAT.BODY);
    const [fa0, fa1] = faceRange("front", cx, cy, hw, hd);
    if (p.lobby) {
      paintFace(M, "front", fa0 + 0.4 * s, fa1 - 0.4 * s, 0.4 * s, (podH - 0.3 * fh) * s, MAT.GLASS_W, 2);
      paintFace(M, "front", cx - 1.5 * s, cx + 1.5 * s, 0.2 * s, Math.min(2.9, fh * 0.86) * s, MAT.GLASS, 2);
      paintFace(M, "front", fa0 + 0.4 * s, fa1 - 0.4 * s, (podH - 0.3 * fh) * s, (podH - 0.3 * fh) * s + Math.max(1, 0.18 * s), MAT.FRAME, 2);
    } else {
      punchedWindows(M, "front", fa0 + 0.5 * s, fa1 - 0.5 * s, 0, podF, fh, s, p.density, rng);
    }
    // port cochere: entrance canopy on two steel columns
    const py = facePlane(M, "front", cx, 3 * s);
    if (py >= 0) {
      const cw2 = Math.min(hw * 0.55, 4.5 * s), colT = Math.max(1, 0.2 * s);
      M.boxR(cx - cw2, cx + cw2, py, py + 2.4 * s, 3.7 * s, 4.0 * s, MAT.ALU);
      M.boxR(cx - cw2 + 0.4 * s, cx - cw2 + 0.4 * s + colT, py + 2.0 * s, py + 2.4 * s, 0, 3.7 * s, MAT.STEEL);
      M.boxR(cx + cw2 - 0.4 * s - colT, cx + cw2 - 0.4 * s, py + 2.0 * s, py + 2.4 * s, 0, 3.7 * s, MAT.STEEL);
    }
    // guestroom tower (slightly recessed from the podium)
    const tw = hw * 0.86, td = hd * 0.9;
    M.boxC(cx, cy, (podH + bodyH) * s / 2, tw, td, (bodyH - podH) * s / 2, MAT.BODY);
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, tw, td);
      if (p.tileFacade) tileTexture(M, face, a0, a1, podH * s, bodyH * s, s, 2);
      guestRoomWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, podH * s, floors - podF, fh, s, p.density, rng);
      bandLines(M, face, a0, a1, podH * s, bodyH * s, fh, s, 0.4, MAT.FRAME);   // 腰線
      if (p.neon) for (let z = podH + 5 * fh; z < bodyH - 0.1; z += 5 * fh)
        paintFace(M, face, a0, a1, z * s, z * s + Math.max(1, 0.5 * s), MAT.ACCENT, 2);
    }
    // rooftop sign frame (屋上サイン)
    roofSignFrame(M, cx, cy - Math.min(td * 0.25, 1.5 * s), bodyH * s, Math.min(tw * 0.85, 6.5 * s), s, p.neon, rng);
    if (p.balconies) for (let f = podF; f < floors; f++)
      balconyStrip(M, "back", cx - tw + 0.5 * s, cx + tw - 0.5 * s, f * fh * s, s, fh, 3.2, p.ac, rng);
    return { cx, cy, hwM: tw / s, hdM: td / s, zM: bodyH };
  }

  // ---- HO2 Business hotel ビジネスホテル: narrow slab, dense room grid, external stair + lift shaft
  M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
  for (const face of FACES) {
    const [a0, a1] = faceRange(face, cx, cy, hw, hd);
    if (p.tileFacade) tileTexture(M, face, a0, a1, fh * s, bodyH * s, s, 2);
    guestRoomWindows(M, face, a0 + 0.3 * s, a1 - 0.3 * s, fh * s, floors - 1, fh, s, "dense", rng);
    bandLines(M, face, a0, a1, 0, bodyH * s, fh, s, 0.3, MAT.FRAME);
  }
  if (p.lobby) {
    const [fa0, fa1] = faceRange("front", cx, cy, hw, hd);
    paintFace(M, "front", fa0 + 0.4 * s, fa1 - 0.4 * s, 0.3 * s, Math.min(2.8, fh * 0.86) * s, MAT.GLASS_W, 2);
    paintFace(M, "front", cx - 0.9 * s, cx + 0.9 * s, 0.3 * s, Math.min(2.4, fh * 0.8) * s, MAT.GLASS, 2);
  } else {
    punchedWindows(M, "front", cx - hw + 0.4 * s, cx + hw - 0.4 * s, 0, 1, fh, s, p.density, rng);
  }
  // projecting lift shaft on the left face
  const ex = Math.min(2.4 * s, hw * 0.6), shW = Math.max(2.2 * s, hd * 0.5);
  M.boxR(cx - hw - ex, cx - hw, cy - shW / 2, cy + shW / 2, 0, bodyH * s, MAT.CONCRETE);
  for (let f = 0; f < floors; f++)
    paintFace(M, "left", cy - shW / 2 + 0.3 * s, cy + shW / 2 - 0.3 * s,
      f * fh * s + 0.6 * s, f * fh * s + Math.min(2.0, fh * 0.62) * s, MAT.GLASS, 2);
  // external evacuation stair on the right face
  externalStair(M, s, cx, cy, hwM, hdM, floors, fh);
  if (p.balconies) for (let f = 1; f < floors; f++)
    balconyStrip(M, "back", cx - hw + 0.4 * s, cx + hw - 0.4 * s, f * fh * s, s, fh, 3.0, p.ac, rng);
  return { cx, cy, hwM, hdM, zM: bodyH };
}

function deptForm(M, p, rng, s, cx, cy, hwM, hdM) {
  const fh = fhOf(p), floors = p.floors, bodyH = floors * fh;
  const hw = hwM * s, hd = hdM * s;

  if (p.form === "DP1") { // ---- Department store 百貨店: glass base, horizontal canopies, rooftop sign frame
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    const baseF = Math.max(1, Math.min(2, floors - 1)), baseTop = baseF * fh * s;
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, baseTop, bodyH * s, s, 2);   // stone panel joints
      if (p.lobby) {
        paintFace(M, face, a0 + 0.35 * s, a1 - 0.35 * s, 0.35 * s, baseTop - 0.3 * s, MAT.GLASS_W, 2);
        for (let a = a0; a <= a1 + 0.01; a += 2.4 * s)
          paintFace(M, face, a, a + Math.max(1, 0.2 * s), 0.35 * s, baseTop, MAT.ALU, 2);   // giant mullions
        for (let a = a0 + 0.8 * s; a + 2.4 * s < a1; a += 3.4 * s)
          paintFace(M, face, a, a + 2.4 * s, 0.8 * s, Math.min(baseTop - 0.8 * s, 3.2 * s), MAT.GLASS, 2);
      } else {
        punchedWindows(M, face, a0 + 0.5 * s, a1 - 0.5 * s, 0, baseF, fh, s, p.density, rng);
      }
      // upper floors: horizontal display band windows (ショーウィンドウ) + piers
      for (let f = baseF; f < floors; f++) {
        const za = f * fh * s + 0.9 * s, zb = f * fh * s + Math.max(1.4, fh - 0.9) * s;
        paintFace(M, face, a0 + 0.5 * s, a1 - 0.5 * s, za, zb, MAT.GLASS, 2);
        for (let a = a0; a <= a1 + 0.01; a += 2.2 * s)
          paintFace(M, face, a, a + Math.max(1, 0.16 * s), za, zb, MAT.FRAME, 2);
      }
    }
    // 雨棚: continuous horizontal canopies at every floor line
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      for (let f = baseF; f <= floors; f++)
        canopyBand(M, face, a0 - 0.1 * s, a1 + 0.1 * s, f * fh * s, s, 1.1, MAT.ALU);
    }
    // entrance canopy
    const py = facePlane(M, "front", cx, 2.2 * s);
    if (py >= 0) {
      const ecw = Math.min(hw * 0.6, 5.5 * s);
      M.boxR(cx - ecw, cx + ecw, py, py + 2.6 * s, 4.2 * s, 4.5 * s, MAT.ALU);
      M.boxR(cx - 0.9 * s, cx + 0.9 * s, py + 0.1 * s, py + 0.25 * s, 4.5 * s, 5.4 * s, MAT.SIGN);
    }
    // protruding circulation core at the right end
    const coreW = Math.min(3.2 * s, hw * 0.7), coreP = 2.0 * s;
    M.boxR(cx + hw, cx + hw + coreP, cy - coreW / 2, cy + coreW / 2, 0, bodyH * s, MAT.CONCRETE);
    for (let f = 0; f < floors; f++)
      paintFace(M, "right", cy - coreW / 2 + 0.3 * s, cy + coreW / 2 - 0.3 * s,
        f * fh * s + 0.6 * s, f * fh * s + Math.min(2.0, fh * 0.6) * s, MAT.GLASS, 2);
    // rooftop billboard frame (屋上看板架)
    roofSignFrame(M, cx, cy - Math.min(hd * 0.2, 1.5 * s), bodyH * s, Math.min(hw * 0.8, 7.5 * s), s, p.neon, rng);
    if (p.balconies) for (let f = baseF - 1; f < baseF; f++)
      balconyStrip(M, "front", cx - hw + 0.6 * s, cx + hw - 0.6 * s, f * fh * s, s, fh, 6.5, p.ac, rng);
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  // ---- DP2 Shopping centre ショッピングセンター: wide low box, long canopy, rooftop parking, pylon sign
  M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
  const gf = Math.max(1, Math.min(2, floors - 1)), gh = gf * fh * s;
  const [fa0, fa1] = faceRange("front", cx, cy, hw, hd);
  // continuous 2-storey curtain front
  paintFace(M, "front", fa0 + 0.3 * s, fa1 - 0.3 * s, 0.3 * s, gh - 0.3 * s, MAT.GLASS_W, 2);
  for (let a = fa0; a <= fa1 + 0.01; a += 2.6 * s)
    paintFace(M, "front", a, a + Math.max(1, 0.2 * s), 0.3 * s, gh, MAT.ALU, 2);
  for (let a = fa0 + 1.0 * s; a + 3.0 * s < fa1; a += 4.2 * s)
    paintFace(M, "front", a, a + 3.0 * s, 0.9 * s, Math.min(gh - 0.9 * s, 3.4 * s), MAT.GLASS, 2);
  for (const face of ["back", "left", "right"]) {
    const [a0, a1] = faceRange(face, cx, cy, hw, hd);
    if (p.tileFacade) tileTexture(M, face, a0, a1, 0, bodyH * s, s, 2);
    punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, 0, floors, fh, s, p.density, rng);
    bandLines(M, face, a0, a1, 0, bodyH * s, fh, s, 0.26, MAT.FRAME);
  }
  // upper floors: continuous display ribbon on the front
  for (let f = gf; f < floors; f++) {
    const za = f * fh * s + 0.9 * s, zb = f * fh * s + Math.max(1.4, fh - 0.9) * s;
    paintFace(M, "front", fa0 + 0.5 * s, fa1 - 0.5 * s, za, zb, MAT.GLASS, 2);
    for (let a = fa0; a <= fa1 + 0.01; a += 2.6 * s)
      paintFace(M, "front", a, a + Math.max(1, 0.16 * s), za, zb, MAT.FRAME, 2);
  }
  // long horizontal canopy over the entrances (横長の雨棚)
  canopyBand(M, "front", fa0 - 0.2 * s, fa1 + 0.2 * s, gh, s, 2.2, MAT.ALU);
  const py = facePlane(M, "front", cx, 1.5 * s);
  if (py >= 0 && p.neon) {
    M.boxR(fa0 + 0.3 * s, fa1 - 0.3 * s, py + 2.0 * s, py + 2.15 * s, gh - 0.5 * s, gh - 0.35 * s, MAT.ACCENT);
  }
  // corner pylon sign (独立看板) — stays inside the 7 m roof headroom margin
  const px = cx - hw - 2.8 * s, py2 = cy + hd - 1.2 * s;
  const ph = Math.min((bodyH + 5.5) * s, Math.max(8 * s, bodyH * 1.15 * s));
  M.cylZ(px, py2, 0, ph, Math.max(1, 0.22 * s), Math.max(1, 0.22 * s), MAT.STEEL);
  neonPanel(M, rng, s, px - 2.2 * s, px + 2.2 * s, py2 - 0.25 * s, py2 + 0.25 * s, ph - 3.4 * s, ph);
  if (p.balconies) for (let f = 1; f < floors; f++)
    balconyStrip(M, "back", cx - hw + 0.4 * s, cx + hw - 0.4 * s, f * fh * s, s, fh, 4.0, p.ac, rng);
  if (p.lobby) {
    const yw = facePlane(M, "front", cx, 1.2 * s);
    if (yw >= 0) M.boxR(cx - 1.6 * s, cx + 1.6 * s, yw, yw + 0.3 * s, 0.2 * s, Math.min(3.2, fh * 0.9) * s, MAT.GLASS);
  }
  return { cx, cy, hwM, hdM, zM: bodyH, deck: true, roofAc: !!p.ac };
}

function hospitalForm(M, p, rng, s, cx, cy, hwM, hdM) {
  const fh = fhOf(p), floors = p.floors, bodyH = floors * fh;
  const hw = hwM * s, hd = hdM * s;

  if (p.form === "HP1") { // ---- General hospital 総合病院: long slab, ribbon wards, equipment floor, helipad
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    const eqF = Math.max(1, floors - 1);
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, 0, eqF * fh * s, s);
      ribbonWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, fh * s, eqF - 1, fh, s, p.density);
      bandLines(M, face, a0, a1, fh * s, eqF * fh * s, fh, s, 0.3, MAT.FRAME);
      louverBand(M, face, a0, a1, eqF * fh * s, bodyH * s - Math.max(1, 0.05 * s), s);
    }
    // ground floor: outpatient lobby glass + entrance canopy
    if (p.lobby) {
      for (const face of ["front", "right"]) {
        const [a0, a1] = faceRange(face, cx, cy, hw, hd);
        paintFace(M, face, a0 + 0.4 * s, a1 - 0.4 * s, 0.35 * s, Math.min(fh - 0.35, 3.2) * s, MAT.GLASS_W, 2);
      }
      canopyBand(M, "front", cx - hw + 0.4 * s, cx + hw - 0.4 * s, fh * s, s, 2.0, MAT.ALU);
      const sy = facePlane(M, "front", cx, fh * s + 0.8 * s);
      if (sy >= 0) M.boxR(cx - Math.min(hw * 0.4, 3.5 * s), cx + Math.min(hw * 0.4, 3.5 * s), sy, sy + 0.18 * s, fh * s + 0.5 * s, fh * s + 1.4 * s, MAT.SIGN);
    } else {
      punchedWindows(M, "front", cx - hw + 0.4 * s, cx + hw - 0.4 * s, 0, 1, fh, s, p.density, rng);
    }
    redCrossSign(M, "front", cx, fh * s + 1.5 * s, s);   // 病院サイン
    if (p.balconies) for (let f = 1; f < eqF; f++)
      balconyStrip(M, "back", cx - hw + 0.4 * s, cx + hw - 0.4 * s, f * fh * s, s, fh, 3.2, p.ac, rng);
    return { cx, cy, hwM, hdM, zM: bodyH, helipad: !!p.helipad };
  }

  // ---- HP2 Ward block 病棟: low ward wing + tall clinical tower (stepped L massing)
  const lowF = Math.max(2, floors - 2), lowH = lowF * fh;
  const lowHalf = hw * 0.58, towHalf = hw * 0.42;
  const lx = cx - hw + lowHalf, tx = cx + hw - towHalf;
  // ward wing
  M.boxC(lx, cy, lowH * s / 2, lowHalf, hd, lowH * s / 2, MAT.BODY);
  M.boxR(lx - lowHalf, lx + lowHalf, cy - hd, cy + hd, lowH * s, lowH * s + Math.max(1, 0.18 * s), MAT.ROOF);
  // clinical tower
  M.boxC(tx, cy, bodyH * s / 2, towHalf, hd, bodyH * s / 2, MAT.BODY);
  const eqF = Math.max(1, floors - 1);
  // ward wing facades
  for (const face of ["front", "back", "left"]) {
    const [a0, a1] = faceRange(face, lx, cy, lowHalf, hd);
    if (p.tileFacade) tileTexture(M, face, a0, a1, fh * s, lowH * s, s);
    ribbonWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, fh * s, lowF - 1, fh, s, p.density);
    bandLines(M, face, a0, a1, fh * s, lowH * s, fh, s, 0.3, MAT.FRAME);
    punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, 0, 1, fh, s, p.density, rng);
  }
  // clinical tower facades: ribbon wards + louvered equipment top floor
  for (const face of FACES) {
    const [a0, a1] = faceRange(face, tx, cy, towHalf, hd);
    if (p.tileFacade && face !== "left") tileTexture(M, face, a0, a1, fh * s, eqF * fh * s, s);
    ribbonWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, fh * s, eqF - 1, fh, s, p.density);
    bandLines(M, face, a0, a1, fh * s, eqF * fh * s, fh, s, 0.3, MAT.FRAME);
    louverBand(M, face, a0, a1, eqF * fh * s, bodyH * s - Math.max(1, 0.05 * s), s);
  }
  // outpatient lobby at the ward wing entrance
  if (p.lobby) {
    paintFace(M, "front", lx - lowHalf + 0.4 * s, lx + lowHalf - 0.4 * s, 0.3 * s, Math.min(fh - 0.35, 3.2) * s, MAT.GLASS_W, 2);
    canopyBand(M, "front", lx - lowHalf + 0.3 * s, lx + lowHalf - 0.3 * s, fh * s, s, 1.8, MAT.ALU);
  } else {
    punchedWindows(M, "front", lx - lowHalf + 0.4 * s, lx + lowHalf - 0.4 * s, 0, 1, fh, s, p.density, rng);
  }
  redCrossSign(M, "front", lx, fh * s + 1.5 * s, s);   // 病院サイン
  if (p.balconies) for (let f = 1; f < lowF; f++)
    balconyStrip(M, "back", lx - lowHalf + 0.4 * s, lx + lowHalf - 0.4 * s, f * fh * s, s, fh, 3.0, p.ac, rng);
  let helipadPad = null;
  if (p.helipad) helipadPad = {
    cx: lx, cy, z: Math.round(lowH * s) + 2,
    r: Math.max(2, Math.min(lowHalf, hd) * 0.52),
  };
  return { cx: tx, cy, hwM: towHalf / s, hdM, zM: bodyH, helipadPad };
}

function danchiForm(M, p, rng, s, cx, cy, hwM, hdM) {
  const fh = fhOf(p), floors = p.floors, bodyH = floors * fh;
  const hw = hwM * s, hd = hdM * s;

  if (p.form === "DC1") { // ---- Danchi slab 団地: long board, open corridor, end stair towers
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    for (const face of ["back", "left", "right"]) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, 0, bodyH * s, s, 1.5);
      punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, 0, floors, fh, s, p.density, rng);
      bandLines(M, face, a0, a1, 0, bodyH * s, fh, s, 0.22, MAT.FRAME);
    }
    // front: unit doors + kitchen windows on the wall, then the open corridor in front
    for (let f = 0; f < floors; f++) {
      const z = f * fh * s;
      for (let a = cx - hw + 2.0 * s; a < cx + hw - 1.2 * s; a += 3.8 * s) {
        paintFace(M, "front", a, a + 0.8 * s, z + 0.15 * s, z + 2.0 * s, MAT.WOOD, 2);           // 住戸ドア
        paintFace(M, "front", a + 1.0 * s, a + 2.0 * s, z + 0.9 * s, z + 1.9 * s, MAT.GLASS, 2); // 台所窓
      }
      if (p.lobby && f === 0) {
        const [a0, a1] = faceRange("front", cx, cy, hw, hd);
        paintFace(M, "front", a0 + 0.4 * s, a1 - 0.4 * s, 0.2 * s, Math.min(2.4, fh * 0.8) * s, MAT.GLASS_W, 2);
      }
      if (f > 0) openCorridor(M, "front", cx - hw, cx + hw, z, s, fh, p.ac, p.rooftopClutter, rng);
    }
    // end stair towers (突出階段室) + roof bulkheads
    const coreW = Math.min(3.0 * s, hw * 0.5), coreP = 2.2 * s;
    for (const sgn of [-1, 1]) {
      const x0 = sgn < 0 ? cx - hw : cx + hw - coreW, x1 = x0 + coreW;
      const y1 = cy + hd + coreP;
      M.boxR(x0, x1, cy + hd - 0.2 * s, y1, 0, bodyH * s + 1.2 * s, MAT.CONCRETE);
      for (let f = 0; f < floors; f++)
        paintFace(M, "front", x0 + 0.35 * s, x1 - 0.35 * s, f * fh * s + 0.6 * s,
          f * fh * s + Math.min(2.2, fh * 0.6) * s, MAT.GLASS, 2);
      M.boxR(x0 + 0.2 * s, x1 - 0.2 * s, y1 - Math.max(1, 0.1 * s), y1, bodyH * s, bodyH * s + 0.9 * s, MAT.METAL);
    }
    if (p.balconies) for (let f = 1; f < floors; f++)
      balconyStrip(M, "back", cx - hw + 0.4 * s, cx + hw - 0.4 * s, f * fh * s, s, fh, 3.4, p.ac, rng);
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  // ---- DC2 Public housing 公団住宅: two stepped wings + central stair core + roof terrace
  const lowF = Math.max(2, floors - 2), lowH = lowF * fh;
  const gap = Math.min(3.2 * s, hw * 0.45), wingW = (2 * hw - gap) / 2, wh = wingW / 2;
  const lx = cx - hw + wh, rx = cx + hw - wh;
  // left wing lower, right wing full height
  M.boxC(lx, cy, lowH * s / 2, wh, hd, lowH * s / 2, MAT.BODY);
  M.boxC(rx, cy, bodyH * s / 2, wh, hd, bodyH * s / 2, MAT.BODY);
  // central stair / elevator core bridging the gap
  const coreHalf = gap / 2;
  M.boxC(cx, cy, bodyH * s / 2, coreHalf, hd * 0.7, bodyH * s / 2, MAT.CONCRETE);
  for (let f = 0; f < floors; f++)
    paintFace(M, "front", cx - coreHalf + 0.25 * s, cx + coreHalf - 0.25 * s,
      f * fh * s + 0.5 * s, f * fh * s + Math.min(2.2, fh * 0.55) * s, MAT.GLASS, 2);
  for (const [wx, wHalf, wF] of [[lx, wh, lowF], [rx, wh, floors]]) {
    for (const face of ["back", "left", "right"]) {
      const [a0, a1] = faceRange(face, wx, cy, wHalf, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, 0, wF * fh * s, s, 1.5);
      punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, 0, wF, fh, s, p.density, rng);
      bandLines(M, face, a0, a1, 0, wF * fh * s, fh, s, 0.22, MAT.FRAME);
    }
    for (let f = 0; f < wF; f++) {
      const z = f * fh * s;
      for (let a = wx - wHalf + 1.8 * s; a < wx + wHalf - 0.8 * s; a += 3.8 * s) {
        paintFace(M, "front", a, a + 0.8 * s, z + 0.15 * s, z + 2.0 * s, MAT.WOOD, 2);
        paintFace(M, "front", a + 1.0 * s, a + 2.0 * s, z + 0.9 * s, z + 1.9 * s, MAT.GLASS, 2);
      }
      if (p.lobby && f === 0)   // 共用玄関: glass entrance bay next to the stair core
        paintFace(M, "front", wx - wHalf * 0.3, wx + wHalf * 0.3, 0.2 * s,
          Math.min(2.4, fh * 0.8) * s, MAT.GLASS_W, 2);
      if (f > 0) openCorridor(M, "front", wx - wHalf, wx + wHalf, z, s, fh, p.ac, p.rooftopClutter, rng);
    }
    if (p.balconies) for (let f = 1; f < wF; f++)
      balconyStrip(M, "back", wx - wHalf + 0.4 * s, wx + wHalf - 0.4 * s, f * fh * s, s, fh, 3.4, p.ac, rng);
  }
  // roof terrace on the lower wing (屋上テラス) + optional planters
  terrace(M, lx, cy, Math.max(0.6 * s, wh - 0.2 * s), Math.max(0.6 * s, hd - 0.2 * s), lowH * s, s, p.garden, rng, MAT.ROOF);
  return { cx: rx, cy, hwM: wh / s, hdM, zM: bodyH };
}

// ---------------------------------------------------------------- COMMERCIAL forms
function commercialForm(M, p, rng, s, cx, cy, hwM, hdM) {
  const fh = fhOf(p), floors = p.floors, bodyH = floors * fh;
  const hw = hwM * s, hd = hdM * s;

  if (p.form === "CM1") { // ---- Suburban SC 郊外SC: wide low mall + taller anchor + rooftop parking
    const mainF = Math.max(1, Math.min(2, floors - 1)), mainH = mainF * fh;
    const mainHalf = hw * 0.62, anchHalf = hw * 0.38;
    const lx = cx - hw + mainHalf, rx = cx + hw - anchHalf;
    M.boxC(lx, cy, mainH * s / 2, mainHalf, hd, mainH * s / 2, MAT.BODY);
    M.boxC(rx, cy, bodyH * s / 2, anchHalf, hd * 0.92, bodyH * s / 2, MAT.BODY);
    // mall block: 2F glass storefronts + long canopy
    for (const face of ["front", "back", "left"]) {
      const [a0, a1] = faceRange(face, lx, cy, mainHalf, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, 0, mainH * s, s, 2);
      if (p.lobby) {
        paintFace(M, face, a0 + 0.4 * s, a1 - 0.4 * s, 0.4 * s, Math.min(4.8, mainH - 0.5) * s, MAT.GLASS_W, 2);
        for (let a = a0; a <= a1 + 0.01; a += 3.2 * s)
          paintFace(M, face, a, a + Math.max(1, 0.2 * s), 0.4 * s, mainH * s, MAT.ALU, 2);
      } else {
        punchedWindows(M, face, a0 + 0.5 * s, a1 - 0.5 * s, 0, mainF, fh, s, p.density, rng);
      }
    }
    const [ma0, ma1] = faceRange("front", lx, cy, mainHalf, hd);
    canopyBand(M, "front", ma0 - 0.2 * s, ma1 + 0.2 * s, Math.min(5.4, mainH - 0.4) * s, s, 2.8, MAT.ALU);
    if (p.neon) {
      const py = facePlane(M, "front", lx, 2 * s);
      if (py >= 0) M.boxR(ma0 + 0.3 * s, ma1 - 0.3 * s, py + 2.55 * s, py + 2.7 * s, Math.min(5.4, mainH - 0.4) * s - 0.15 * s, Math.min(5.4, mainH - 0.4) * s, MAT.ACCENT);
    }
    // anchor block: banded windows + roof sign frame
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, rx, cy, anchHalf, hd * 0.92);
      if (p.tileFacade) tileTexture(M, face, a0, a1, 0, bodyH * s, s, 2);
      punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, 0, floors, fh, s, p.density, rng);
      spandrelBands(M, face, a0, a1, 0, bodyH * s, fh, s);
    }
    roofSignFrame(M, rx, cy, bodyH * s, Math.min(anchHalf * 0.8, 6 * s), s, p.neon, rng);
    // rooftop parking on the mall roof (屋上駐車場)
    parkingDeck(M, lx, cy, Math.max(1.2 * s, mainHalf - 0.3 * s), Math.max(1.2 * s, hd - 0.3 * s), mainH * s, s, rng);
    // pylon sign at the far-left corner
    const px = cx - hw - 2.8 * s, py2 = cy + hd - 1.2 * s;
    const ph = Math.min((bodyH + 5.5) * s, Math.max(8 * s, bodyH * 1.15 * s));
    M.cylZ(px, py2, 0, ph, Math.max(1, 0.24 * s), Math.max(1, 0.24 * s), MAT.STEEL);
    neonPanel(M, rng, s, px - 2.2 * s, px + 2.2 * s, py2 - 0.25 * s, py2 + 0.25 * s, ph - 3.6 * s, ph);
    if (p.balconies) for (let f = 1; f < floors; f++)
      balconyStrip(M, "back", rx - anchHalf + 0.4 * s, rx + anchHalf - 0.4 * s, f * fh * s, s, fh, 3.6, p.ac, rng);
    return { cx: rx, cy, hwM: anchHalf / s, hdM: hd * 0.92 / s, zM: bodyH, roofAc: !!p.ac };
  }

  if (p.form === "CM2") { // ---- Station building 駅ビル: long slab, tall concourse glass, gallery deck
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    const concH = Math.min(6.4, fh * 1.7);
    const f0 = Math.max(1, Math.ceil(concH / fh));
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, concH * s, bodyH * s, s, 2);
      if (p.lobby) {
        paintFace(M, face, a0 + 0.35 * s, a1 - 0.35 * s, 0.35 * s, concH * s, MAT.GLASS_W, 2);
        for (let a = a0; a <= a1 + 0.01; a += 3.4 * s)
          paintFace(M, face, a, a + Math.max(1, 0.24 * s), 0.35 * s, concH * s, MAT.ALU, 2);
      } else {
        punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, 0, f0, fh, s, p.density, rng);
      }
      ribbonWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, f0 * fh * s, floors - f0, fh, s, p.density);
      bandLines(M, face, a0, a1, f0 * fh * s, bodyH * s, fh, s, 0.28, MAT.FRAME);
      if (face === "front" || face === "back")            // station piers
        for (let a = a0; a <= a1 + 0.01; a += 6.0 * s)
          paintFace(M, face, a, a + Math.max(1, 0.3 * s), concH * s, bodyH * s, MAT.BODY, 2);
    }
    // elevated pedestrian gallery (ペデストリアンデッキ) across the front
    const deckH = Math.min(concH + 1.2, fh * 1.9) * s;
    const front = facePlane(M, "front", cx, deckH - 1);
    if (front >= 0) {
      M.boxR(cx - hw, cx + hw, front, front + 2.8 * s, deckH, deckH + Math.max(1, 0.28 * s), MAT.CONCRETE);
      M.boxR(cx - hw, cx + hw, front + 2.8 * s - Math.max(1, 0.1 * s), front + 2.8 * s, deckH, deckH + 1.0 * s, MAT.METAL);
      for (let a = cx - hw + 1.2 * s; a < cx + hw; a += 8.0 * s)
        M.boxR(a, a + Math.max(1, 0.4 * s), front + 2.0 * s, front + 2.4 * s, 0, deckH, MAT.CONCRETE);
    }
    // big entrance canopy + station sign
    canopyBand(M, "front", cx - Math.min(hw * 0.5, 5 * s), cx + Math.min(hw * 0.5, 5 * s), concH * s, s, 3.2, MAT.ALU);
    const sy = facePlane(M, "front", cx, (concH + 0.9) * s);
    if (sy >= 0) M.boxR(cx - Math.min(hw * 0.55, 6 * s), cx + Math.min(hw * 0.55, 6 * s), sy, sy + 0.2 * s, (concH + 0.5) * s, (concH + 1.5) * s, MAT.SIGN);
    roofSignFrame(M, cx, cy, bodyH * s, Math.min(hw * 0.55, 8 * s), s, p.neon, rng);
    if (p.balconies) for (let f = f0 + 1; f < floors; f++)
      balconyStrip(M, "back", cx - hw + 0.4 * s, cx + hw - 0.4 * s, f * fh * s, s, fh, 4.2, p.ac, rng);
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  if (p.form === "CM3") { // ---- Fashion building ファッションビル: narrow tower of stacked signs
    M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
    const baseH = Math.min(4.8, fh * 1.15);
    for (const face of FACES) {
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      if (p.tileFacade) tileTexture(M, face, a0, a1, 0, bodyH * s, s, 2);
      for (let f = 1; f < floors; f++) {                 // display windows on every floor
        const z = f * fh * s;
        paintFace(M, face, a0 + 0.4 * s, a1 - 0.4 * s, z + 0.7 * s, z + Math.min(2.7, fh - 0.7) * s, MAT.GLASS_W, 2);
      }
      if (p.lobby) paintFace(M, face, a0 + 0.3 * s, a1 - 0.3 * s, 0.3 * s, baseH * s, MAT.GLASS_W, 2);
      else punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, 0, 1, fh, s, p.density, rng);
    }
    // dense stacked sign columns on the front (看板ビル)
    for (const rel of [-0.52, 0.52]) {
      const sx = cx + hw * rel;
      const plane = facePlane(M, "front", sx, bodyH * s * 0.5);
      if (plane < 0) continue;
      let idx = 0;
      for (let z = baseH * s + 0.4 * s; z + 1.4 * s < bodyH * s; z += 1.55 * s) {
        neonPanel(M, rng, s, sx - 0.85 * s, sx + 0.85 * s, plane, plane + 0.3 * s, z, z + 1.35 * s);
        idx++;
      }
    }
    // entrance canopy + top sign frame
    canopyBand(M, "front", cx - Math.min(hw * 0.8, 3.2 * s), cx + Math.min(hw * 0.8, 3.2 * s), baseH * s, s, 1.8, MAT.ALU);
    roofSignFrame(M, cx, cy, bodyH * s, Math.min(hw * 0.8, 4.5 * s), s, p.neon, rng);
    if (p.balconies) for (let f = 2; f < floors; f++)
      balconyStrip(M, "back", cx - hw + 0.4 * s, cx + hw - 0.4 * s, f * fh * s, s, fh, 2.8, p.ac, rng);
    return { cx, cy, hwM, hdM, zM: bodyH };
  }

  // ---- CM4 Big-box store 大型量販店: single-storey box + surface parking apron + pylon
  const apronY0 = Math.max(cy + hd + 1, cy + hd + 0.5 * s);
  M.boxR(0, M.W - 1, apronY0, M.D - 1, 0, 1, MAT.ASPHALT);
  const bayT = Math.max(1, 0.14 * s);
  for (let x = 2.0 * s; x < M.W - 2.0 * s; x += 2.9 * s) {
    M.boxR(x, x + bayT, apronY0 + Math.max(1, 2.2 * s), M.D - Math.max(1, 1.6 * s), 1, 1, MAT.WHITE);
    if (chance(rng, 0.6))
      M.boxC(x + 1.1 * s, apronY0 + Math.max(2.0, 3.6) * s, 0.55 * s, 0.55 * s, 0.95 * s, 0.35 * s,
        pick(rng, [MAT.WHITE, MAT.BLACK, MAT.ALU, MAT.METAL]));
  }
  M.boxC(cx, cy, bodyH * s / 2, hw, hd, bodyH * s / 2, MAT.BODY);
  for (const face of ["back", "left", "right"]) {
    const [a0, a1] = faceRange(face, cx, cy, hw, hd);
    if (p.tileFacade) tileTexture(M, face, a0, a1, 0, bodyH * s, s, 2);
    punchedWindows(M, face, a0 + 0.4 * s, a1 - 0.4 * s, 0, floors, fh, s, p.density, rng);
    bandLines(M, face, a0, a1, 0, bodyH * s, fh, s, 0.26, MAT.FRAME);
  }
  const [fa0, fa1] = faceRange("front", cx, cy, hw, hd);
  const storeH = Math.min(4.8, bodyH - 0.4);
  if (p.lobby) {
    paintFace(M, "front", fa0 + 0.3 * s, fa1 - 0.3 * s, 0.3 * s, storeH * s, MAT.GLASS_W, 2);
    for (let a = fa0; a <= fa1 + 0.01; a += 3.0 * s)
      paintFace(M, "front", a, a + Math.max(1, 0.22 * s), 0.3 * s, storeH * s, MAT.ALU, 2);
    paintFace(M, "front", cx - 1.8 * s, cx + 1.8 * s, 0.3 * s, Math.min(3.2, storeH) * s, MAT.GLASS, 2);
    canopyBand(M, "front", fa0 - 0.2 * s, fa1 + 0.2 * s, (storeH + 0.1) * s, s, 2.4, MAT.ALU);
    const py = facePlane(M, "front", cx, (storeH + 0.5) * s);
    if (py >= 0) M.boxR(cx - Math.min(hw * 0.5, 5 * s), cx + Math.min(hw * 0.5, 5 * s), py, py + 0.2 * s,
      (storeH + 0.5) * s, (storeH + 1.3) * s, MAT.SIGN);
  } else {
    punchedWindows(M, "front", fa0 + 0.4 * s, fa1 - 0.4 * s, 0, floors, fh, s, p.density, rng);
  }
  // pylon sign in the car park
  const px = cx - hw - 2.8 * s, py2 = cy + hd + Math.max(1.5, 2.0) * s;
  const ph = Math.min((bodyH + 6.0) * s, Math.max(9 * s, bodyH * 1.6 * s));
  M.cylZ(px, py2, 0, ph, Math.max(1, 0.24 * s), Math.max(1, 0.24 * s), MAT.STEEL);
  neonPanel(M, rng, s, px - 2.2 * s, px + 2.2 * s, py2 - 0.25 * s, py2 + 0.25 * s, ph - 3.4 * s, ph);
  if (p.balconies) {
    if (floors > 1) for (let f = 1; f < floors; f++)
      balconyStrip(M, "back", cx - hw + 0.4 * s, cx + hw - 0.4 * s, f * fh * s, s, fh, 3.6, p.ac, rng);
    else {                                             // loading dock platform + railing
      M.boxR(cx - hw * 0.85, cx + hw * 0.85, cy - hd - 1.6 * s, cy - hd, 1.1 * s, 1.25 * s, MAT.CONCRETE);
      railing(M, cx - hw * 0.85, cx + hw * 0.85, cy - hd - 1.6 * s, cy - hd, 1.25 * s, s, 1.0);
    }
  }
  return { cx, cy, hwM, hdM, zM: bodyH, roofAc: !!p.ac };
}

// ---------------------------------------------------------------- Tokyo detail kit
function addVerticalSign(M, p, rng, s, cx, cy, hwM, hdM) {
  if (!p.verticalSign) return;
  const fh = fhOf(p), bodyH = p.floors * fh;
  const hw = hwM * s, hd = hdM * s;
  const panelH = 1.1 * s, panelW = 0.9 * s, prot = 0.25 * s, t = Math.max(1, 0.1 * s);
  let face, aC, z0, z1;
  if (p.type === "office" && (p.form === "O1" || p.form === "O7")) {
    face = "front"; aC = cx - hw + 0.7 * s; z0 = fh * s; z1 = (bodyH - 1) * s;
  } else if (p.type === "office") {
    face = "right"; aC = cy - hd * 0.3; z0 = bodyH * 0.45 * s; z1 = (bodyH - 1) * s;
  } else if (p.type === "hotel") {          // guestroom blade sign from the 2F up
    face = "front"; aC = cx + hw * (p.form === "HO1" ? 0.84 : 1.0) - 0.9 * s;
    z0 = (p.form === "HO1" ? 2.2 : 1.4) * fh * s; z1 = Math.max(z0 + panelH, (bodyH - 0.6) * s);
  } else if (p.type === "department") {     // big corner sign above the glass base
    face = "front"; aC = cx + hw - 1.1 * s;
    z0 = 2.1 * fh * s; z1 = Math.max(z0 + panelH, (bodyH - 0.5) * s);
  } else if (p.type === "hospital") {       // institutional sign next to the entrance
    face = "front"; aC = cx - hw + 1.2 * s;
    z0 = Math.min(1.1 * fh, bodyH * 0.25) * s; z1 = Math.max(z0 + panelH, Math.min(bodyH - 0.5, 3.2 * fh) * s);
  } else if (p.type === "danchi") {         // 棟名 sign on the gable end wall
    face = "right"; aC = cy - hd * 0.25;
    z0 = fh * s; z1 = Math.max(z0 + panelH, Math.min(bodyH - 0.5, 4 * fh) * s);
  } else if (p.type === "commercial") {     // retail sign column on the street corner
    face = "front"; aC = cx + hw - 1.2 * s;
    z0 = Math.min(1.4 * fh, bodyH * 0.3) * s; z1 = Math.max(z0 + panelH, (bodyH - 0.5) * s);
  } else {
    face = "front"; aC = cx + hw - 0.7 * s; z0 = 3 * s; z1 = Math.min(bodyH - 1, 6) * s;
  }
  if (z1 < z0 + panelH) return;
  let idx = 0;
  for (let z = z0; z + panelH <= z1; z += panelH + 0.15 * s) {
    // the wall may be recessed or stop (podium, low wings) — skip panels with no facade behind
    const plane = facePlane(M, face, aC, z + panelH / 2);
    if (plane < 0) continue;
    const neon = NEONS[(idx + ri(rng, 0, 4)) % NEONS.length]; idx++;
    if (face === "front" || face === "back") {
      const y0 = face === "front" ? plane : plane - prot, y1 = face === "front" ? plane + prot : plane;
      M.boxR(aC - panelW / 2, aC + panelW / 2, y0, y1, z, z + panelH, MAT.BLACK);
      M.boxR(aC - panelW / 2 + t, aC + panelW / 2 - t, y0, y1, z + t, z + panelH - t, neon);
    } else {
      const x0 = face === "right" ? plane : plane - prot, x1 = face === "right" ? plane + prot : plane;
      M.boxR(x0, x1, aC - panelW / 2, aC + panelW / 2, z, z + panelH, MAT.BLACK);
      M.boxR(x0, x1, aC - panelW / 2 + t, aC + panelW / 2 - t, z + t, z + panelH - t, neon);
    }
  }
}

function addWallAC(M, p, rng, s, cx, cy, hwM, hdM) {
  const fh = fhOf(p), floors = p.floors, hw = hwM * s, hd = hdM * s;
  const faces = (p.type === "residential" && p.balconies) ? ["left", "right"] : FACES;
  if (p.acUnits) {
    for (let f = floors > 1 ? 1 : 0; f < Math.max(1, floors); f++) {
      if (!chance(rng, 0.5)) continue;
      const face = pick(rng, faces);
      const [a0, a1] = faceRange(face, cx, cy, hw, hd);
      const a = a0 + (0.2 + rng() * 0.6) * (a1 - a0);
      acBox(M, face, a, f * fh * s + 1.4 * s, s);
    }
  }
  // ordinary types get a regular per-unit AC row so the `ac` knob reads clearly
  if (p.ac && (NEW_TYPES.indexOf(p.type) >= 0 || AC_ROW_FORMS.indexOf(p.form) >= 0)) {
    const face = p.type === "hospital" ? "left" : "right";
    const [a0, a1] = faceRange(face, cx, cy, hw, hd);
    const du = 3.2 * s, n = Math.max(1, Math.floor((a1 - a0) / du));
    const off = (a1 - a0 - n * du) / 2;
    for (let f = 2; f < floors; f += 2)
      for (let i = 0; i < n; i++)
        acBox(M, face, a0 + off + (i + 0.5) * du, f * fh * s + Math.max(1, 0.9 * s), s);
  }
}

function addRoofExtras(M, p, rng, s, roof) {
  const cx = roof.cx, cy = roof.cy, hw = roof.hwM * s, hd = roof.hdM * s, z = roof.zM * s;
  const deck = !!roof.deck;
  const pad = !!(roof.helipad || roof.helipadPad);
  if (!roof.gable && !roof.acRoof) {
    const slabMat = deck ? MAT.ASPHALT : (NEW_TYPES.indexOf(p.type) >= 0 ? MAT.ROOF : MAT.ROOF_M);
    if (roof.round) M.cylZ(cx, cy, z, z + Math.max(1, 0.15 * s), hw, hd, slabMat);
    else M.boxR(cx - hw, cx + hw, cy - hd, cy + hd, z, z + Math.max(1, 0.15 * s), slabMat);
    const t = Math.max(1, 0.2 * s), ph = 0.5 * s;
    if (roof.round) ringPaint(M, z + 0.15 * s, z + ph, MAT.ROOF);
    else if (!roof.twin) {
      M.boxR(cx - hw, cx + hw, cy - hd, cy - hd + t, z, z + ph, MAT.ROOF);
      M.boxR(cx - hw, cx + hw, cy + hd - t, cy + hd, z, z + ph, MAT.ROOF);
      M.boxR(cx - hw, cx - hw + t, cy - hd, cy + hd, z, z + ph, MAT.ROOF);
      M.boxR(cx + hw - t, cx + hw, cy - hd, cy + hd, z, z + ph, MAT.ROOF);
    }
    if (deck) {                                  // rooftop parking (屋上駐車場): bays + cars
      const zz = Math.round(z + 0.15 * s), lw = Math.max(1, 0.12 * s);
      for (let x = cx - hw + 1.5 * s; x < cx + hw - 0.5 * s; x += 2.8 * s) {
        M.boxR(x, x + lw, cy - hd + 0.6 * s, cy + hd - 0.6 * s, zz, zz, MAT.WHITE);
        if (chance(rng, 0.55))
          M.boxC(x + 1.0 * s, cy + (rng() < 0.5 ? -1 : 1) * hd * 0.42, zz + 0.35 * s,
            0.55 * s, 0.95 * s, 0.3 * s, pick(rng, [MAT.WHITE, MAT.BLACK, MAT.ALU, MAT.METAL]));
      }
    }
    if (p.crown && NEW_TYPES.indexOf(p.type) >= 0) {   // taller crown cornice on ordinary types
      const t2 = Math.max(1, 0.22 * s), ph2 = Math.max(1, 1.15 * s);
      M.boxR(cx - hw, cx + hw, cy - hd, cy - hd + t2, z, z + ph2, MAT.FRAME);
      M.boxR(cx - hw, cx + hw, cy + hd - t2, cy + hd, z, z + ph2, MAT.FRAME);
      M.boxR(cx - hw, cx - hw + t2, cy - hd, cy + hd, z, z + ph2, MAT.FRAME);
      M.boxR(cx + hw - t2, cx + hw, cy - hd, cy + hd, z, z + ph2, MAT.FRAME);
    }
    if (p.neon && !roof.twin) {
      if (roof.round) ringPaint(M, z + ph, z + ph + Math.max(1, 0.15 * s), MAT.ACCENT);
      else if (NEW_TYPES.indexOf(p.type) >= 0) {       // perimeter glow, not a solid neon deck
        const t3 = Math.max(1, 0.32 * s);
        M.boxR(cx - hw, cx + hw, cy - hd, cy - hd + t3, z + ph, z + ph + Math.max(1, 0.12 * s), MAT.ACCENT);
        M.boxR(cx - hw, cx + hw, cy + hd - t3, cy + hd, z + ph, z + ph + Math.max(1, 0.12 * s), MAT.ACCENT);
        M.boxR(cx - hw, cx - hw + t3, cy - hd, cy + hd, z + ph, z + ph + Math.max(1, 0.12 * s), MAT.ACCENT);
        M.boxR(cx + hw - t3, cx + hw, cy - hd, cy + hd, z + ph, z + ph + Math.max(1, 0.12 * s), MAT.ACCENT);
      } else M.boxR(cx - hw, cx + hw, cy - hd, cy + hd, z + ph, z + ph + Math.max(1, 0.12 * s), MAT.ACCENT);
    }
  }
  const dz = z + 0.15 * s;
  const insetX = Math.max(0.5 * s, hw - 0.8 * s), insetY = Math.max(0.5 * s, hd - 0.8 * s);
  if (pad) {                                     // hospital helipad on the flat roof
    if (roof.helipadPad) helipad(M, roof.helipadPad.cx, roof.helipadPad.cy, roof.helipadPad.z, roof.helipadPad.r, s);
    else helipad(M, cx, cy, dz + Math.max(1, 0.2 * s), Math.min(hw, hd) * 0.5, s);
  }
  if (roof.roofAc) {                             // department store: rooftop AC row (ac knob)
    for (let x = cx - insetX * 0.9; x <= cx + insetX * 0.9; x += 2.0 * s)
      M.boxC(x, cy + insetY * 0.8, dz + 0.35 * s, 0.55 * s, 0.42 * s, 0.3 * s, MAT.WHITE);
  }
  if (p.mechanical && !roof.acRoof && hw > 2 * s && hd > 2 * s) {
    const mw = Math.min(2.2 * s, hw * 0.7), md = Math.min(1.8 * s, hd * 0.7);
    const mx = pad ? cx - insetX * 0.72 : cx - insetX * (0.25 + rng() * 0.3);
    const my = pad ? cy + insetY * 0.58 : cy - insetY * (0.2 + rng() * 0.3);
    M.boxC(mx, my, dz + 0.7 * s, mw / 2, md / 2, 0.7 * s, MAT.METAL);
    M.boxC(mx, my, dz + 1.45 * s, mw / 2 - 0.2 * s, md / 2 - 0.2 * s, 0.08 * s, MAT.STEEL);
  }
  if (p.antenna) {
    const ax = pad ? cx + insetX * 0.8 : cx + (chance(rng, 0.5) ? 1 : -1) * insetX * 0.55;
    const ay = pad ? cy + insetY * 0.55 : cy - insetY * 0.2;
    const ah = (3 + rng() * 2.5) * s, r = Math.max(1, 0.12 * s);
    M.cylZ(ax, ay, dz, dz + ah, r, r, MAT.STEEL);
    M.boxC(ax, ay, dz + ah + 0.15 * s, Math.max(1, 0.15 * s), Math.max(1, 0.15 * s), 0.15 * s, MAT.NRED);
  }
  if (p.garden && !roof.gable) {
    for (let i = 0, n = ri(rng, 3, 6); i < n; i++)
      M.boxC(cx + (rng() * 2 - 1) * insetX * 0.8, cy + (rng() * 2 - 1) * insetY * 0.8, dz + 0.18 * s,
        (0.6 + rng() * 0.9) * s, (0.5 + rng() * 0.7) * s, 0.18 * s, MAT.GREEN);
  }
  // ---- rooftop clutter: crooked penthouse, water tank, laundry pole, planters
  if (p.rooftopClutter && !roof.acRoof && hw > 1.5 * s && hd > 1.5 * s) {
    const pw = Math.min(2.6 * s, hw * 0.9), pd = Math.min(2.0 * s, hd * 0.8);
    const px = pad ? cx - insetX * 0.62 : cx + (rng() - 0.5) * insetX * 0.7;
    const py = pad ? cy - insetY * 0.62 : cy + (rng() - 0.5) * insetY * 0.5;
    M.boxC(px, py, dz + 1.1 * s, pw / 2, pd / 2, 1.1 * s, MAT.BODY);                 // crooked penthouse
    M.boxC(px + (rng() - 0.5) * 0.6 * s, py + (rng() - 0.5) * 0.5 * s, dz + 2.5 * s, pw * 0.3, pd * 0.3, 0.4 * s, MAT.ROOF);
    const doorY = py + pd / 2;
    M.boxR(px - 0.4 * s, px + 0.4 * s, doorY, doorY + 0.1 * s, dz, dz + 1.8 * s, MAT.BLACK);
    if (hw > 2.5 * s && hd > 2 * s) {                                               // water tank on legs
      const tx = pad ? cx + insetX * 0.72 : cx - insetX * 0.6;
      const ty = pad ? cy - insetY * 0.5 : cy + insetY * 0.55;
      const tr = Math.min(0.8 * s, hw * 0.2);
      for (const [lx, ly] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
        M.boxR(tx + lx * tr * 0.7, tx + lx * tr * 0.7 + Math.max(1, 0.1 * s), ty + ly * tr * 0.7, ty + ly * tr * 0.7 + Math.max(1, 0.1 * s), dz, dz + 0.5 * s, MAT.STEEL);
      M.cylZ(tx, ty, dz + 0.5 * s, dz + 1.7 * s, tr, tr, MAT.ALU);
    }
    if (!pad) {
      const lx = cx + insetX * 0.7, ly = cy - insetY * 0.6;                          // laundry pole
      M.boxR(lx, lx + Math.max(1, 0.12 * s), ly, ly + Math.max(1, 0.12 * s), dz, dz + 1.6 * s, MAT.STEEL);
      M.boxR(lx - 1.0 * s, lx + 1.0 * s, ly, ly + Math.max(1, 0.1 * s), dz + 1.5 * s, dz + 1.6 * s, MAT.STEEL);
      for (let i = 0; i < 3; i++) M.boxC(lx - 0.7 * s + i * 0.7 * s, ly, dz + 1.2 * s, 0.18 * s, 0.1 * s, 0.25 * s, pick(rng, [MAT.WHITE, MAT.NBLUE, MAT.NPINK]));
      for (let i = 0; i < 2; i++) planter(M, cx + (rng() - 0.5) * insetX, cy + (rng() - 0.5) * insetY, dz, s);
    }
  }
}

function addNeon(M, p, rng, s, cx, cy, hwM, hdM) {
  if (!p.neon) return;
  const fh = fhOf(p), bodyH = p.floors * fh, hw = hwM * s, hd = hdM * s;
  const bandT = Math.max(1, 0.22 * s);
  paintFace(M, "front", cx - hw, cx + hw, (bodyH - 0.55) * s, (bodyH - 0.55) * s + bandT, MAT.ACCENT, 2);
  paintFace(M, "back", cx - hw, cx + hw, (bodyH - 0.55) * s, (bodyH - 0.55) * s + bandT, MAT.ACCENT, 2);
  if (chance(rng, 0.7)) {
    const f = ri(rng, 1, Math.max(1, p.floors - 2)), zb = f * fh * s + 0.1 * s;
    paintFace(M, "front", cx - hw, cx + hw, zb, zb + bandT, MAT.ACCENT, 2);
  }
}

// ---------------------------------------------------------------- billboards
function neonPanel(M, rng, s, x0, x1, y0, y1, z0, z1) {
  M.boxR(x0, x1, y0, y1, z0, z1, MAT.BLACK);
  const t = Math.max(1, 0.15 * s), neon2 = pick(rng, NEONS);
  M.boxR(x0 + t, x1 - t, y0, y1, z0 + t, z1 - t, MAT.ACCENT);
  const rows = Math.max(2, Math.round((z1 - z0) / (0.5 * s)));
  for (let r = 0; r < rows; r++) if (chance(rng, 0.35)) {
    const za = z0 + t + (z1 - z0 - 2 * t) * r / rows, zb = z0 + t + (z1 - z0 - 2 * t) * (r + 0.7) / rows;
    M.boxR(x0 + t, x1 - t, y0, y1, za, zb, neon2);
  }
  for (let g = 0, n = ri(rng, 3, 6); g < n; g++) {
    const gw = (0.3 + rng() * 0.5) * s, gh = (0.3 + rng() * 0.4) * s;
    const gx = x0 + t + rng() * Math.max(0.1, (x1 - x0 - 2 * t - gw));
    const gz = z0 + t + rng() * Math.max(0.1, (z1 - z0 - 2 * t - gh));
    M.boxR(gx, gx + gw, y0, y1, gz, gz + gh, MAT.SIGN);
  }
}
function addBillboard(M, p, rng, s, cx, cy, hwM, hdM, roof) {
  if (p.billboard === "none") return;
  const fh = fhOf(p), bodyH = p.floors * fh, hw = hwM * s, hd = hdM * s;
  if (p.billboard === "rooftop") {
    const bw = Math.min(hwM * 0.9, 8) * s, bh = 2.2 * s, z0 = roof.zM * s + 0.4 * s;
    const x0 = cx - bw / 2, x1 = cx + bw / 2, y = cy + roof.hdM * s * 0.45;
    M.boxR(x0 + bw * 0.15, x0 + bw * 0.15 + Math.max(1, 0.15 * s), y, y + 0.3 * s, roof.zM * s, z0, MAT.STEEL);
    M.boxR(x1 - bw * 0.15, x1 - bw * 0.15 + Math.max(1, 0.15 * s), y, y + 0.3 * s, roof.zM * s, z0, MAT.STEEL);
    neonPanel(M, rng, s, x0, x1, y, y + 0.35 * s, z0, z0 + bh);
  } else if (p.billboard === "vertical") {
    const ph = bodyH * 0.38 * s, pw = 1.6 * s, z0 = bodyH * 0.52 * s, ay = cy - hd * 0.3;
    const xw = facePlane(M, "right", ay, z0 + ph / 2);
    if (xw >= 0) neonPanel(M, rng, s, xw, xw + 0.35 * s, ay - pw / 2, ay + pw / 2, z0, z0 + ph);
  } else if (p.billboard === "horizontal") {
    const bw = Math.min(hwM * 1.4, 14) * s, bh = 1.6 * s, z0 = (bodyH - 2.4) * s;
    const yw = facePlane(M, "front", cx, z0 + bh / 2);
    if (yw >= 0) neonPanel(M, rng, s, cx - bw / 2, cx + bw / 2, yw, yw + 0.3 * s, z0, z0 + bh);
  } else if (p.billboard === "pole") {
    const poleH = Math.max(8, bodyH * 0.6) * s, px = cx - hw - 2.2 * s, py = cy + hd * 0.5;
    const r = Math.max(1, 0.18 * s);
    M.cylZ(px, py, 0, poleH, r, r, MAT.STEEL);
    neonPanel(M, rng, s, px - 1.8 * s, px + 1.8 * s, py - 0.2 * s, py + 0.2 * s, poleH, poleH + 2.4 * s);
  }
}

// ---------------------------------------------------------------- shading (kit.py)
function shade(M, ramps) {
  const W = M.W, D = M.D, H = M.H, mat = M.mat, WD = W * D, N = WD * H;
  const occ = new Uint8Array(N);
  for (let i = 0; i < N; i++) occ[i] = mat[i] ? 1 : 0;
  const rgb = new Uint8Array(N * 3), emis = new Uint8Array(N);
  const surf = new Uint8Array(N);
  for (let z = 0; z < H; z++) for (let y = 0; y < D; y++) {
    let i = z * WD + y * W;
    for (let x = 0; x < W; x++, i++) {
      if (!occ[i]) continue;
      if (x === 0 || x === W - 1 || y === 0 || y === D - 1 || z === 0 || z === H - 1 ||
          !occ[i - 1] || !occ[i + 1] || !occ[i - W] || !occ[i + W] || !occ[i - WD] || !occ[i + WD]) surf[i] = 1;
    }
  }
  const act = new Uint8Array(N);
  for (let z = 0; z < H; z++) for (let y = 0; y < D; y++) {
    let i = z * WD + y * W;
    for (let x = 0; x < W; x++, i++) {
      if (!surf[i]) continue;
      act[i] = 1;
      if (x > 0 && occ[i - 1]) act[i - 1] = 1;
      if (x < W - 1 && occ[i + 1]) act[i + 1] = 1;
      if (y > 0 && occ[i - W]) act[i - W] = 1;
      if (y < D - 1 && occ[i + W]) act[i + W] = 1;
      if (z > 0 && occ[i - WD]) act[i - WD] = 1;
      if (z < H - 1 && occ[i + WD]) act[i + WD] = 1;
    }
  }
  function occAt(x, y, z) {
    return (x < 0 || y < 0 || z < 0 || x >= W || y >= D || z >= H) ? 0 : occ[z * WD + y * W + x];
  }
  const Lx = LIGHT[0], Ly = LIGHT[1], Lz = LIGHT[2];
  const lev = new Uint8Array(N);
  for (let z = 0; z < H; z++) for (let y = 0; y < D; y++) {
    let i = z * WD + y * W;
    for (let x = 0; x < W; x++, i++) {
      if (!act[i] || !occ[i]) continue;
      let nx = 0, ny = 0, nz = 0;
      for (let dz = -1; dz <= 1; dz++) {
        const wz = dz === 0 ? 2 : 1;
        for (let dy = -1; dy <= 1; dy++) {
          const wgt = wz * (dy === 0 ? 2 : 1);
          nx += wgt * (occAt(x - 1, y + dy, z + dz) - occAt(x + 1, y + dy, z + dz));
        }
        for (let dx = -1; dx <= 1; dx++) {
          const wgt = wz * (dx === 0 ? 2 : 1);
          ny += wgt * (occAt(x + dx, y - 1, z + dz) - occAt(x + dx, y + 1, z + dz));
        }
      }
      for (let dx = -1; dx <= 1; dx++) {
        const wx = dx === 0 ? 2 : 1;
        for (let dy = -1; dy <= 1; dy++) {
          nz += wx * (dy === 0 ? 2 : 1) * (occAt(x + dx, y + dy, z - 1) - occAt(x + dx, y + dy, z + 1));
        }
      }
      const mag = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const b = mag < 1e-5 ? 0 : (nx * Lx + ny * Ly + nz * Lz) / mag;
      lev[i] = b >= 0.62 ? 3 : b >= 0.32 ? 2 : b >= -0.05 ? 1 : 0;
    }
  }
  for (let i = 0; i < N; i++) {
    const m = mat[i];
    if (!m) continue;
    const c = ramps[m][act[i] ? lev[i] : 1];
    rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2];
    emis[i] = EMISSIVE.has(m) ? 1 : 0;
  }
  return { rgb, emis, occ };
}

// ---------------------------------------------------------------- generate
function generate(params) {
  const t0 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
  const p = normalizeParams(params);
  const fh = fhOf(p);
  const widthM = computeWidthM(p);
  const depthM = computeDepthM(p);
  const bodyH = p.floors * fh;
  const totalH = bodyH + 7;
  // protruding cores / pylons / lift shafts / canopies need extra lateral margin per form
  const FORM_MARGIN = {
    HO1: 1.6, HO2: 3.0, DP1: 2.6, DP2: 5.6, HP1: 1.8, HP2: 1.8, DC1: 3.2, DC2: 2.0,
    O11: 1.8, O12: 2.0, O13: 1.8, O14: 1.8, R4: 1.8, R5: 2.0, R6: 2.0, R7: 1.8,
    CM1: 5.6, CM2: 2.4, CM3: 2.0, CM4: 5.4,
  };
  const FORM_MARGIN_Y = {
    R5: 3.2, R6: 2.8, R7: 2.4, HO1: 2.6, CM1: 4.6, CM2: 4.8, CM4: 7.2, O13: 2.2,
  };
  const marginX = Math.max(p.billboard === "pole" ? 4.5 : (p.form === "O1" ? 1.8 : 1.6), FORM_MARGIN[p.form] || 0);
  const marginY = Math.max(2.2, FORM_MARGIN_Y[p.form] || 0);
  let W = Math.max(8, Math.round((widthM + 2 * marginX) * p.scale));
  let D = Math.max(8, Math.round((depthM + 2 * marginY) * p.scale));
  let H = Math.max(8, Math.round(totalH * p.scale));
  const fit = Math.min(1, CAP.W / W, CAP.D / D, CAP.H / H);
  if (fit < 1) { W = Math.max(8, Math.round(W * fit)); D = Math.max(8, Math.round(D * fit)); H = Math.max(8, Math.round(H * fit)); }
  const s = p.scale * fit;
  p.widthM = widthM; p.depthM = depthM;
  const rng = mulberry32(((p.seed * 2654435761) >>> 0) ^ 0x9e3779b9);
  const M = new Model(W, D, H);
  const cx = (W - 1) / 2, cy = (D - 1) / 2;
  const hwM = widthM / 2, hdM = depthM / 2;
  const roof = p.type === "office" ? officeForm(M, p, rng, s, cx, cy, hwM, hdM)
    : p.type === "residential" ? resForm(M, p, rng, s, cx, cy, hwM, hdM)
    : p.type === "hotel" ? hotelForm(M, p, rng, s, cx, cy, hwM, hdM)
    : p.type === "department" ? deptForm(M, p, rng, s, cx, cy, hwM, hdM)
    : p.type === "hospital" ? hospitalForm(M, p, rng, s, cx, cy, hwM, hdM)
    : p.type === "danchi" ? danchiForm(M, p, rng, s, cx, cy, hwM, hdM)
    : commercialForm(M, p, rng, s, cx, cy, hwM, hdM);
  addWallAC(M, p, rng, s, cx, cy, hwM, hdM);
  addVerticalSign(M, p, rng, s, cx, cy, hwM, hdM);
  addNeon(M, p, rng, s, cx, cy, hwM, hdM);
  addRoofExtras(M, p, rng, s, roof);
  addBillboard(M, p, rng, s, cx, cy, hwM, hdM, roof);
  const { rgb, emis, occ } = shade(M, rampsFor(p));
  const WD = W * D, bounds = new Array(H);
  let occupied = 0, slicesUsed = 0;
  for (let z = 0; z < H; z++) {
    const base = z * WD;
    let minX = W, maxX = -1, minY = D, maxY = -1;
    for (let y = 0; y < D; y++) {
      const row = base + y * W;
      for (let x = 0; x < W; x++) {
        if (!occ[row + x]) continue;
        occupied++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    bounds[z] = maxX < 0 ? { empty: true } : { empty: false, minX, maxX, minY, maxY };
    if (maxX >= 0) slicesUsed++;
  }
  const t1 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
  return {
    params: p, w: W, h: D, n: H, mat: M.mat, rgb, emis, occ, bounds,
    meta: { widthM, depthM, heightM: bodyH, totalH, floors: p.floors, fit, ms: t1 - t0, occupied, slicesUsed, grid: [W, D, H] },
  };
}

// ---------------------------------------------------------------- software render
function renderFrame(g, opts) {
  opts = opts || {};
  const angle = opts.angle || 0;
  const squash = opts.squash == null ? 0.75 : clamp(opts.squash, 0.2, 1);
  const spacing = opts.spacing == null ? 1 : opts.spacing;
  const night = !!opts.night, outline = opts.outline !== false;
  const w = g.w, h = g.h, n = g.n, rgb = g.rgb, occ = g.occ, emis = g.emis, bounds = g.bounds;
  const area = w * h;
  const diag = Math.ceil(Math.hypot(w, h)) + 4;
  const liftMax = Math.ceil((n - 1) * spacing);
  const cw = diag + 8, ch = Math.ceil(diag * squash) + liftMax + 10;
  let sc = opts.scratch;
  if (!sc || sc.w !== cw || sc.h !== ch) {
    sc = { w: cw, h: ch, rgba: new Uint8ClampedArray(cw * ch * 4), alpha: new Uint8Array(cw * ch), em: new Uint8Array(cw * ch) };
  }
  sc.rgba.fill(0); sc.alpha.fill(0); sc.em.fill(0);
  const out = sc.rgba, alpha = sc.alpha, em = sc.em;
  const rad = angle * Math.PI / 180, ca = Math.cos(rad), sa = Math.sin(rad);
  const invSq = 1 / Math.max(squash, 0.1);
  const hcw = (w - 1) * 0.5, hch = (h - 1) * 0.5;
  const cx = cw / 2, baseY = ch - Math.ceil(diag * squash / 2) - 4;
  for (let z = 0; z < n; z++) {
    const b = bounds[z];
    if (b.empty) continue;
    const zBase = z * area;
    const yc = baseY - Math.round(z * spacing);
    const ex0 = b.minX - hcw - 0.5, ex1 = b.maxX - hcw + 0.5;
    const ey0 = b.minY - hch - 0.5, ey1 = b.maxY - hch + 0.5;
    let mnx = Infinity, mxx = -Infinity, mny = Infinity, mxy = -Infinity;
    for (let c = 0; c < 4; c++) {
      const px = c === 0 || c === 3 ? ex0 : ex1;
      const py = c < 2 ? ey0 : ey1;
      const rx = px * ca - py * sa, ry = (px * sa + py * ca) * squash;
      if (rx < mnx) mnx = rx; if (rx > mxx) mxx = rx;
      if (ry < mny) mny = ry; if (ry > mxy) mxy = ry;
    }
    const xMin = Math.max(0, Math.floor(cx + mnx)), xMax = Math.min(cw - 1, Math.ceil(cx + mxx));
    const yMin = Math.max(0, Math.floor(yc + mny)), yMax = Math.min(ch - 1, Math.ceil(yc + mxy));
    if (xMin > xMax || yMin > yMax) continue;
    for (let y = yMin; y <= yMax; y++) {
      const dy = (y - yc) * invSq;
      let sx = (xMin - cx) * ca + dy * sa + hcw;
      let sy = -(xMin - cx) * sa + dy * ca + hch;
      let idx = y * cw + xMin;
      for (let x = xMin; x <= xMax; x++, idx++, sx += ca, sy -= sa) {
        const ix = Math.round(sx), iy = Math.round(sy);
        if (ix < 0 || iy < 0 || ix >= w || iy >= h) continue;
        const vi = zBase + iy * w + ix;
        if (!occ[vi]) continue;
        const p3 = vi * 3, p4 = idx * 4;
        let r = rgb[p3], gg = rgb[p3 + 1], bb = rgb[p3 + 2];
        if (night) {
          if (emis[vi]) { em[idx] = 1; r = Math.min(255, r * 1.18 + 30); gg = Math.min(255, gg * 1.18 + 28); bb = Math.min(255, bb * 1.18 + 24); }
          else { r = r * 0.40 + 6; gg = gg * 0.42 + 8; bb = bb * 0.52 + 18; }
        }
        out[p4] = r; out[p4 + 1] = gg; out[p4 + 2] = bb; out[p4 + 3] = 255;
        alpha[idx] = 1;
      }
    }
  }
  if (outline) {
    for (let y = 1; y < ch - 1; y++) {
      let idx = y * cw + 1;
      for (let x = 1; x < cw - 1; x++, idx++) {
        if (alpha[idx]) continue;
        if (alpha[idx - 1] || alpha[idx + 1] || alpha[idx - cw] || alpha[idx + cw]) {
          const p4 = idx * 4;
          out[p4] = OUTLINE[0]; out[p4 + 1] = OUTLINE[1]; out[p4 + 2] = OUTLINE[2]; out[p4 + 3] = 255;
        }
      }
    }
  }
  if (night) {
    for (let y = 1; y < ch - 1; y++) {
      let idx = y * cw + 1;
      for (let x = 1; x < cw - 1; x++, idx++) {
        if (em[idx] || alpha[idx]) continue;
        let src = -1;
        if (em[idx - 1]) src = idx - 1; else if (em[idx + 1]) src = idx + 1;
        else if (em[idx - cw]) src = idx - cw; else if (em[idx + cw]) src = idx + cw;
        if (src < 0) continue;
        const sp = src * 4, dp = idx * 4;
        out[dp] = out[sp] * 0.55; out[dp + 1] = out[sp + 1] * 0.55; out[dp + 2] = out[sp + 2] * 0.55; out[dp + 3] = 200;
      }
    }
  }
  return sc;
}

// ---------------------------------------------------------------- slice strip
function stripData(g) {
  const w = g.w, h = g.h, n = g.n, rgb = g.rgb, occ = g.occ;
  const MAXW = 32000;
  const spr = Math.max(1, Math.min(n, Math.floor(MAXW / w)));
  const rows = Math.ceil(n / spr);
  const width = spr * w, height = rows * h;
  const data = new Uint8ClampedArray(width * height * 4);
  const area = w * h;
  for (let z = 0; z < n; z++) {
    const row = Math.floor(z / spr), col = z % spr;
    const ox = col * w, oy = row * h, zBase = z * area;
    for (let y = 0; y < h; y++) {
      let di = ((oy + y) * width + ox) * 4;
      let vi = zBase + y * w;
      for (let x = 0; x < w; x++, vi++, di += 4) {
        if (!occ[vi]) continue;
        const p3 = vi * 3;
        data[di] = rgb[p3]; data[di + 1] = rgb[p3 + 1]; data[di + 2] = rgb[p3 + 2]; data[di + 3] = 255;
      }
    }
  }
  return { data, width, height, slicesPerRow: spr, rows, sliceW: w, sliceH: h, count: n };
}

// ---------------------------------------------------------------- export
return {
  mulberry32, R, MAT, EMISSIVE, PALETTES, FORMS, FORM_NAMES, FORM_META, BILLBOARDS, DENSITIES,
  FH, FLOOR_RANGE, FLOOR_HEIGHT_RANGE, TYPES, NEW_TYPES, ORDINARY_TYPES, CAP, LIGHT, Model,
  defaultParams, normalizeParams, randomParams, computeWidthM, computeDepthM, fhOf,
  generate, renderFrame, stripData,
};
});