// OGP image source generator — 1200×630（ver5「EXHIBITION」）
//
// ver4（コンクリート紙＋48px方眼＋太枠のプレート＋四隅のネジ）から全面転換。
// サイトと同じ「グレーの展示壁 × ベタの色面 × メンフィスのトーテム」で組む。
//
// 文字は**アウトライン済みのものしか置けない**（このリポジトリに opentype.js は無く、
// glyphs.json / og-caption.json は過去に一度だけ焼いたもの）。よって OGP に載せるのは
// ロゴのロックアップと "WEB ENGINEER" の2つだけで、ver5 らしさは色面と図形が担う。
// 新しい文言を載せたくなったら opentype.js を devDependency に足してアウトラインを焼くこと。
//
// usage: node tools/gen-og.cjs        -> writes tools/og.svg
//        PNG（sharp・依存済み）:
//          node -e 'const s=require("sharp"),f=require("fs");s(f.readFileSync("tools/og.svg"),{density:200}).resize(1200,630,{fit:"fill"}).png().toFile("public/ogp.png").then(i=>console.log(i))'
const fs = require("fs");
const path = require("path");
const { lockup, INK: LOGO_INK, BLUE, ORANGE } = require("./gen-logo.cjs");

const W = 1200,
  H = 630;

// ---- ver5 palette（tokens.css と同値。SVG単体で解決する必要があるので直値で持つ）----
const PAPER = "#eeeeee";
const INK = "#1a1a1a";
const PERI = "#7a8cff";
const YELLOW = "#f3f300";
const ORANGE_M = "#ff9000";
const PINK = "#fdbac8";
const SLATE = "#4a5159";
const OLIVE = "#73a11d";

// ---- 図版プレート: ペリウィンクルの色面。天地を裁ち落として右半分を通す。
//      （サムネイルに縮んでも「グレーの壁 ＋ 色面 ＋ 物体」の3要素が崩れない）----
const FIELD = { x: 700, y: 0, w: 500, h: H };

// ---- メンフィスのトーテム（index.astro の art.totem と同じ形）----
const TOTEM = { w: 240, h: 384 };
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

// ---- ロゴのロックアップ（Elms Sans アウトライン焼き込み済み）----
const SCALE = 0.95;
const LOCKUP_W = 513 * SCALE,
  LOCKUP_H = 95 * SCALE;
const LOCKUP_X = 84,
  LOCKUP_Y = 262;
const lockupSvg = lockup({ ink: LOGO_INK, blue: BLUE, orange: ORANGE }, "og").replace(
  /^<svg[^>]*>/,
  `<svg x="${LOCKUP_X}" y="${LOCKUP_Y}" width="${LOCKUP_W}" height="${LOCKUP_H}" viewBox="0 0 513 95">`
);

// ---- 肩書き（Geist Mono 500・アウトライン済み・+0.12em tracking）----
const caption = JSON.parse(fs.readFileSync(path.join(__dirname, "og-caption.json")));
const CAPTION_SCALE = 1.35;
const CAPTION_BASELINE = LOCKUP_Y + LOCKUP_H + 74;

// ---- 左下の帯: 部屋の色を小さく並べた見本（展示の索引の見立て）----
const swatches = [YELLOW, PINK, PERI, OLIVE, SLATE];
const SW = 34,
  SW_GAP = 10,
  SW_Y = H - 92;
const swatchRow = swatches
  .map((c, i) => `<rect x="${84 + i * (SW + SW_GAP)}" y="${SW_Y}" width="${SW}" height="${12}" fill="${c}" />`)
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}" />
  <rect x="${FIELD.x}" y="${FIELD.y}" width="${FIELD.w}" height="${FIELD.h}" fill="${PERI}" />
  ${totem}
  ${lockupSvg}
  <path d="M84 ${CAPTION_BASELINE - 38}H384" stroke="${INK}" stroke-width="1.5" opacity="0.45" />
  <g transform="translate(84 ${CAPTION_BASELINE}) scale(${CAPTION_SCALE})" fill="${INK}">
    <path d="${caption.d}" />
  </g>
  ${swatchRow}
</svg>
`;

fs.writeFileSync(path.join(__dirname, "og.svg"), svg);
console.log("written: tools/og.svg (convert to public/ogp.png at 1200x630)");
