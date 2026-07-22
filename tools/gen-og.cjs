// OGP image source generator — 1200×630
// paper + 48px blueprint grid + hairline plate frame + corner screws,
// centered logo lockup, Geist Mono caption (pre-outlined in og-caption.json)
// usage: node tools/gen-og.cjs        -> writes tools/og.svg
//        PNG (sharp・依存済み):
//          node -e 'const s=require("sharp"),f=require("fs");s(f.readFileSync("tools/og.svg"),{density:200}).resize(1200,630,{fit:"fill"}).png().toFile("public/ogp.png").then(i=>console.log(i))'
//        肩書きは og-caption.json（Geist Mono アウトライン）。文言変更時はこのJSONを差し替える
const fs = require("fs");
const path = require("path");
const { lockup, INK, BLUE, ORANGE } = require("./gen-logo.cjs");

const W = 1200, H = 630;
const PAPER = "#eff0f2"; // ver4.4 コンクリート調グレー紙 oklch(95.5% 0.003 250)

// ---- 48px grid (offset so rows sit symmetrically) ----
let grid = "";
for (let x = 48; x < W; x += 48) grid += `M${x} 0V${H}`;
for (let y = 51; y < H; y += 48) grid += `M0 ${y}H${W}`;

// ---- corner screws ⊕ ----
const screw = (cx, cy) =>
  `<circle cx="${cx}" cy="${cy}" r="9" /><path d="M${cx - 5.5} ${cy}H${cx + 5.5}M${cx} ${cy - 5.5}V${cy + 5.5}" />`;

// ---- centered lockup (nested svg keeps its own coordinate system) ----
const LOCKUP_W = 513 * 1.5, LOCKUP_H = 95 * 1.5;
const lockupSvg = lockup({ ink: INK, blue: BLUE, orange: ORANGE }, "og").replace(
  /^<svg[^>]*>/,
  `<svg x="${(W - LOCKUP_W) / 2}" y="213" width="${LOCKUP_W}" height="${LOCKUP_H}" viewBox="0 0 513 95">`
);

// ---- caption (Geist Mono 500, outlined, +0.12em tracking) ----
const caption = JSON.parse(fs.readFileSync(path.join(__dirname, "og-caption.json")));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}" />
  <path d="${grid}" stroke="rgba(31,36,45,0.07)" stroke-width="1" />
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="rgba(31,36,45,0.85)" stroke-width="2" />
  <g fill="none" stroke="rgba(31,36,45,0.4)" stroke-width="1.5">
    ${screw(58, 58)}${screw(W - 58, 58)}${screw(58, H - 58)}${screw(W - 58, H - 58)}
  </g>
  ${lockupSvg}
  <g transform="translate(${(W - caption.width) / 2} 435)" fill="${INK}" opacity="0.62">
    <path d="${caption.d}" />
  </g>
</svg>
`;

fs.writeFileSync(path.join(__dirname, "og.svg"), svg);
console.log("written: tools/og.svg (convert to public/ogp.png at 1200x630)");
