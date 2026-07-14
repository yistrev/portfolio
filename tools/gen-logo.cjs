// rootscion logo generator v2 — isometric "junction (seed)" mark
//   top: trunk block (iso cube, tip down) / bottom: root grid (inverted wireframe pyramid)
//   the cube tip seats into the pyramid mouth; back edges break behind it (occlusion)
//   orange seed diamond at the junction / wordmark "s" carries a 30° graft slit (real cutout)
// usage: node tools/gen-logo.cjs
const fs = require("fs");
const path = require("path");

const BLUE = "#1358bb";   // oklch(48% 0.17 259)
const ORANGE = "#d56650"; // oklch(64% 0.145 33)
const INK = "#1f242d";    // plate ink

const glyphs = JSON.parse(fs.readFileSync(path.join(__dirname, "glyphs.json")));

// ---- isometric mark on a 96 grid (all edges at exact 30°) ----
// cube: edge 19, tip at (48,47) / mouth rhombus: half-w 24.5 / apex (48,84)
function mark({ w, seed, detail, blue, orange }) {
  const backEdges = detail
    ? `
    <path d="M23.5 55 L35.4 48.1" />
    <path d="M72.5 55 L60.6 48.1" />`
    : "";
  const chevron = detail
    ? `
    <path d="M35.75 69.5 L48 76.57 L60.25 69.5" />`
    : "";
  return `
  <g fill="none" stroke="${blue}" stroke-width="${w}" stroke-linecap="butt" stroke-linejoin="miter">
    <path d="M48 47 L64.45 37.5 V18.5 L48 9 L31.55 18.5 V37.5 Z" />
    <path d="M48 47 V28 M48 28 L64.45 18.5 M48 28 L31.55 18.5" />
    <path d="M23.5 55 L48 69.14 L72.5 55" />${backEdges}
    <path d="M23.5 55 L48 82 L72.5 55" />${chevron}
  </g>
  <path d="M${48 - seed[0]} ${seed[2]} L48 ${seed[2] - seed[1]} L${48 + seed[0]} ${seed[2]} L48 ${seed[2] + seed[1]} Z" fill="${orange}" />`;
}

// ---- 1. mark only (logo-mark.svg) ----
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="rootscion">
${mark({ w: 3.5, seed: [5, 2.89, 54.5], detail: true, blue: BLUE, orange: ORANGE })}
</svg>
`;

// ---- 2. favicon (bolder + simplified for 16-32px) ----
const favSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
${mark({ w: 6.5, seed: [6.5, 3.75, 56], detail: false, blue: BLUE, orange: ORANGE })}
</svg>
`;

// ---- 3. horizontal lockup (logo.svg) ----
// wordmark: Elms Sans 600 outlines; shared "s" in orange with a 30° graft slit
function lockup({ ink, blue, orange }, variant) {
  const sx = glyphs[4].x, cx = glyphs[5].x;
  const scx = (sx + cx) / 2 + 2; // optical center of "s"
  const scy = -24;               // half x-height above baseline
  const dx = 38 * Math.cos(Math.PI / 6), dy = 38 * Math.sin(Math.PI / 6);
  const letters = glyphs
    .map((g, i) => i === 4
      ? `    <path fill="${orange}" mask="url(#graft-${variant})" d="${g.d}" />`
      : `    <path fill="${ink}" d="${g.d}" />`)
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 513 95" role="img" aria-label="rootscion">
  <defs>
    <mask id="graft-${variant}" maskUnits="userSpaceOnUse" x="${sx - 12}" y="-80" width="76" height="92">
      <rect x="${sx - 12}" y="-80" width="76" height="92" fill="#fff" />
      <path d="M${(scx - dx).toFixed(1)} ${(scy + dy).toFixed(1)} L${(scx + dx).toFixed(1)} ${(scy - dy).toFixed(1)}" stroke="#000" stroke-width="2.4" />
    </mask>
  </defs>
  <g transform="translate(-15.5 5)">${mark({ w: 3.5, seed: [5, 2.89, 54.5], detail: true, blue, orange })}
  </g>
  <g transform="translate(76.2 75.5)">
${letters}
  </g>
</svg>
`;
}

const out = path.join(__dirname, "../public");
fs.writeFileSync(path.join(out, "logo.svg"), lockup({ ink: INK, blue: BLUE, orange: ORANGE }, "light"));
fs.writeFileSync(path.join(out, "logo-mark.svg"), markSvg);
fs.writeFileSync(path.join(out, "favicon.svg"), favSvg);
fs.writeFileSync(path.join(out, "logo-dark.svg"),
  lockup({ ink: "#f4f6fa", blue: "#7da2e8", orange: "#dd7a60" }, "dark"));
console.log("written: logo.svg, logo-mark.svg, favicon.svg, logo-dark.svg");
