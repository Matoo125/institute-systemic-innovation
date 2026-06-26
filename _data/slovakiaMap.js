import fs from "node:fs";
import path from "node:path";

/**
 * Build-time Slovak regions map.
 *
 * Reads the regions GeoJSON (CRS84 = lon/lat) and the unemployment CSV, projects
 * each region polygon to SVG-space, joins the latest unemployment value, and
 * returns ready-to-render paths + legend buckets. No runtime library needed.
 */

const GEO = "_data/epsg_4362/regions.geojson";
const CSV = "_data/unemployment.csv";
const WIDTH = 800;
const HEIGHT = 460;
const PAD = 12;
const VALUE_COL = "2026-Q1 (%)"; // latest period shown by the choropleth

// Equirectangular projection scaled by the mean latitude so the country keeps
// its aspect ratio. Good enough for a small static national map.
function project(features) {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const f of features) {
    for (const ring of rings(f.geometry)) {
      for (const [lon, lat] of ring) {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }

  const meanLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const lonScale = Math.cos(meanLat);
  const geoW = (maxLon - minLon) * lonScale;
  const geoH = maxLat - minLat;
  const scale = Math.min((WIDTH - PAD * 2) / geoW, (HEIGHT - PAD * 2) / geoH);
  const offX = (WIDTH - geoW * scale) / 2;
  const offY = (HEIGHT - geoH * scale) / 2;

  return ([lon, lat]) => {
    const x = offX + (lon - minLon) * lonScale * scale;
    const y = offY + (maxLat - lat) * scale; // flip: SVG y grows downward
    return [round(x), round(y)];
  };
}

function rings(geometry) {
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  return [];
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function toPath(geometry, p) {
  return rings(geometry)
    .map((ring) => "M" + ring.map((c) => p(c).join(",")).join("L") + "Z")
    .join(" ");
}

function centroid(geometry, p) {
  // Area-weighted centroid of the largest ring — good enough for label placement.
  const ring = rings(geometry).sort((a, b) => b.length - a.length)[0].map(p);
  let area = 0, cx = 0, cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const f = x0 * y1 - x1 * y0;
    area += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  area *= 0.5;
  if (!area) return ring[0];
  return [round(cx / (6 * area)), round(cy / (6 * area))];
}

function parseUnemployment() {
  const text = fs.readFileSync(path.join(process.cwd(), CSV), "utf8").trim();
  const lines = text.split(/\r?\n/);
  const header = lines[0].split("\t");
  const col = header.indexOf(VALUE_COL);
  const map = {};
  for (const line of lines.slice(1)) {
    const cells = line.split("\t");
    const name = cells[0].replace(/\s*kraj$/i, "").trim(); // "Bratislavský kraj" -> "Bratislavský"
    const value = parseFloat(cells[col]);
    if (!Number.isNaN(value)) map[name] = value;
  }
  return { map, period: VALUE_COL };
}

// 5-step sequential scale (light -> dark) keyed by unemployment %.
const BUCKETS = [
  { max: 3, color: "#cde0ff", label: "< 3 %" },
  { max: 5, color: "#8fb6ff", label: "3–5 %" },
  { max: 7, color: "#5d8df0", label: "5–7 %" },
  { max: 9, color: "#3a63c4", label: "7–9 %" },
  { max: Infinity, color: "#243f86", label: "≥ 9 %" },
];

function bucketColor(value) {
  if (value == null) return "var(--color-surface-3)";
  return (BUCKETS.find((b) => value < b.max) || BUCKETS[BUCKETS.length - 1]).color;
}

export default function () {
  const geo = JSON.parse(fs.readFileSync(path.join(process.cwd(), GEO), "utf8"));
  const { map: values, period } = parseUnemployment();
  const p = project(geo.features);

  const regions = geo.features
    .map((f) => {
      const name = f.properties.NM4;
      const value = values[name] ?? null;
      const [cx, cy] = centroid(f.geometry, p);
      return {
        name,
        value,
        color: bucketColor(value),
        path: toPath(f.geometry, p),
        labelX: cx,
        labelY: cy,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "sk"));

  return {
    width: WIDTH,
    height: HEIGHT,
    period,
    regions,
    legend: BUCKETS.map((b) => ({ color: b.color, label: b.label })),
  };
}
