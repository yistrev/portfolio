// OGP image generator — 1200×630
// usage: node tools/gen-og.cjs           -> tools/og.svg
//        node tools/gen-og.cjs --crops   -> 1:1 / 2:1 の中央切り出しも書き出す（OG_CROP_DIR で出力先指定）
//        PNG化:
//          node -e 'const s=require("sharp"),f=require("fs");s(f.readFileSync("tools/og.svg"),{density:200}).resize(1200,630,{fit:"fill"}).png().toFile("public/ogp.png").then(i=>console.log(i))'
// 文字はアウトライン済みのもの（ロゴ / og-caption.json）だけ載せられる。
// 主要要素は中央の正方形 630×630 に収める（SNS の中央トリミング対策）。

const fs = require("fs");
const path = require("path");
const { lockup, INK: LOGO_INK, BLUE, ORANGE } = require("./gen-logo.cjs");

const W = 1200,
  H = 630;

const PAPER = "#eeeeee";
const INK = "#1a1a1a";
const PERI = "#7a8cff";
const YELLOW = "#f3f300";
const ORANGE_M = "#ff9000";
const PINK = "#fdbac8";
const SLATE = "#4a5159";
const OLIVE = "#73a11d";

const SAFE = { x: (W - H) / 2, w: H }; // 1:1 中央切り出しの範囲（x 285〜915）

const SCALE = 0.84;
const LOCKUP_W = 513 * SCALE,
  LOCKUP_H = 95 * SCALE;
const LOCKUP_X = (W - LOCKUP_W) / 2,
  LOCKUP_Y = 92;
const lockupSvg = lockup({ ink: LOGO_INK, blue: BLUE, orange: ORANGE }, "og").replace(
  /^<svg[^>]*>/,
  `<svg x="${LOCKUP_X}" y="${LOCKUP_Y}" width="${LOCKUP_W}" height="${LOCKUP_H}" viewBox="0 0 513 95">`
);

const caption = JSON.parse(fs.readFileSync(path.join(__dirname, "og-caption.json")));
const CAPTION_SCALE = 1.25;
const CAPTION_W = caption.width * CAPTION_SCALE;
const CAPTION_X = (W - CAPTION_W) / 2;
const CAPTION_BASELINE = LOCKUP_Y + LOCKUP_H + 60;
const RULE_Y = CAPTION_BASELINE - 34;

const FIELD = { x: 330, y: 268, w: 540, h: H - 268 };

const TOTEM = { w: 200, h: 320 };
const totemX = FIELD.x + (FIELD.w - TOTEM.w) / 2;
const totemY = FIELD.y + (FIELD.h - TOTEM.h) / 2;
const totem = `<svg x="${totemX}" y="${totemY}" width="${TOTEM.w}" height="${TOTEM.h}" viewBox="0 0 200 320">
    <circle cx="100" cy="40" r="34" fill="${YELLOW}" />
    <path d="M100 84l40 52H60z" fill="${ORANGE_M}" />
    <rect x="46" y="146" width="108" height="14" fill="${INK}" />
    <rect x="46" y="168" width="108" height="14" fill="${INK}" />
    <rect x="46" y="190" width="108" height="14" fill="${INK}" />
    <path d="M22 216h156v22H22z" fill="${PINK}" />
    <rect x="62" y="238" width="26" height="58" fill="${SLATE}" />
    <rect x="112" y="238" width="26" height="58" fill="${SLATE}" />
    <rect x="10" y="296" width="180" height="16" fill="${INK}" />
    <circle cx="172" cy="112" r="16" fill="${OLIVE}" />
  </svg>`;

const TURQUOISE = "#62debb";
const sideShapes = `
  <circle cx="142" cy="318" r="80" fill="${TURQUOISE}" />
  <circle cx="1058" cy="300" r="66" fill="none" stroke="${YELLOW}" stroke-width="22" />`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}" />
  ${sideShapes}
  <rect x="${FIELD.x}" y="${FIELD.y}" width="${FIELD.w}" height="${FIELD.h}" fill="${PERI}" />
  ${totem}
  ${lockupSvg}
  <path d="M${CAPTION_X} ${RULE_Y}H${CAPTION_X + CAPTION_W}" stroke="${INK}" stroke-width="1.5" opacity="0.45" />
  <g transform="translate(${CAPTION_X} ${CAPTION_BASELINE}) scale(${CAPTION_SCALE})" fill="${INK}">
    <path d="${caption.d}" />
  </g>
</svg>
`;

fs.writeFileSync(path.join(__dirname, "og.svg"), svg);
console.log("written: tools/og.svg (convert to public/ogp.png at 1200x630)");
if (process.argv.includes("--crops")) {
  const sharp = require("sharp");
  const outDir = process.env.OG_CROP_DIR || __dirname;
  const png = sharp(Buffer.from(svg), { density: 200 }).resize(W, H, { fit: "fill" }).png();
  Promise.all([
    png.clone().toFile(path.join(outDir, "og-full.png")),
    png.clone().extract({ left: (W - H) / 2, top: 0, width: H, height: H }).toFile(path.join(outDir, "og-crop-1x1.png")),
    png.clone().extract({ left: 0, top: (H - W / 2) / 2, width: W, height: W / 2 }).toFile(path.join(outDir, "og-crop-2x1.png")),
  ]).then(() => console.log("crops written:", outDir));
}
