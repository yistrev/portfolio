import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://rootscion.com',
  server: {
    // 既定は 4321。PORT が渡されたときはそちらを使う
    // （他プロジェクトの dev サーバーと 4321 が衝突するため。Astro は PORT を自動では読まない）
    port: Number(process.env.PORT) || 4321,
  },
});
