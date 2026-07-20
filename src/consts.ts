// サイト共通の定数（GTM・OGP・ブランド）
// メインサイト（Base.astro）とエンジニアモード（engineer.astro）の両方から参照する

export const SITE_NAME = 'rootscion';

export const SITE_DESCRIPTION =
  'rootscion（ルーツサイオン） — 設計から実装、公開後の運用まで並走する Web Engineer のポートフォリオサイト';

/** GTMコンテナID。取得したら 'GTM-XXXXXXX' を実IDに差し替えるとタグが有効になる */
export const GTM_ID = 'GTM-XXXXXXX';

/** GTMを出力するか（プレースホルダのままなら出力しない） */
export const GTM_ENABLED = /^GTM-[A-Z0-9]+$/.test(GTM_ID) && GTM_ID !== 'GTM-XXXXXXX';

/** OGP画像（public/ に 1200×630 で配置する） */
export const OGP_IMAGE = '/ogp.png';
