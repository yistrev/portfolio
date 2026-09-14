// OGP image source generator — 1200×630（ver5「EXHIBITION」）
//
// ver4（コンクリート紙＋48px方眼＋太枠のプレート＋四隅のネジ）から全面転換。
// サイトと同じ「グレーの展示壁 × ベタの色面 × メンフィスのトーテム」で組む。
//
// 文字は**アウトライン済みのものしか置けない**（このリポジトリに opentype.js は無く、
// glyphs.json / og-caption.json は過去に一度だけ焼いたもの）。よって OGP に載せるのは
// ロゴのロックアップと "WEB ENGINEER" の2つだけで、ver5 らしさは色面と図形が担う。
//
// 構図は「中央の正方形に主要要素を全部入れる」。SNS の中央トリミング（1:1 / 2:1）に耐えるため。
// 検証用に 1:1 と 2:1 の中央切り出しも書き出せる: node tools/gen-og.cjs --crops
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

// ---- セーフゾーン ----------------------------------------------------
// X の小カード / LINE のトーク内プレビュー / Threads などは 1:1 の中央切り出し、
// X の大画像カードは 2:1（上下15pxが落ちる）。よって
//   ・ロゴ・肩書き・色面＋トーテムは中央の正方形 630×630（x 285〜915）に収める
//   ・その外側（左右の余白）には、切れても困らない装飾しか置かない
const SAFE = { x: (W - H) / 2, w: H }; // 285 〜 915

// ---- ロゴのロックアップ（Elms Sans アウトライン焼き込み済み）— 中央上 ----
const SCALE = 0.84;
const LOCKUP_W = 513 * SCALE,
  LOCKUP_H = 95 * SCALE;
const LOCKUP_X = (W - LOCKUP_W) / 2,
  LOCKUP_Y = 92;
const lockupSvg = lockup({ ink: LOGO_INK, blue: BLUE, orange: ORANGE }, "og").replace(
  /^<svg[^>]*>/,
  `<svg x="${LOCKUP_X}" y="${LOCKUP_Y}" width="${LOCKUP_W}" height="${LOCKUP_H}" viewBox="0 0 513 95">`
);

// ---- 肩書き（Geist Mono 500・アウトライン済み）— ロゴの下・中央 ----
const caption = JSON.parse(fs.readFileSync(path.join(__dirname, "og-caption.json")));
const CAPTION_SCALE = 1.25;
const CAPTION_W = caption.width * CAPTION_SCALE;
const CAPTION_X = (W - CAPTION_W) / 2;
const CAPTION_BASELINE = LOCKUP_Y + LOCKUP_H + 60;
const RULE_Y = CAPTION_BASELINE - 34;

// ---- 図版プレート: ペリウィンクルの色面 — 中央下、底を裁ち落とす ----
const FIELD = { x: 330, y: 268, w: 540, h: H - 268 }; // x 330〜870 はセーフゾーン内

// ---- メンフィスのトーテム（index.astro の art.totem と同じ形）— 色面の中央 ----
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

// ---- セーフゾーンの外: ステートメントの部屋と同じ2つの形（切れても困らない装飾）----
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

// --crops: 中央トリミングの見え方を確認する（1:1 と 2:1）。出力先は環境変数 OG_CROP_DIR（既定 tools/）
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
