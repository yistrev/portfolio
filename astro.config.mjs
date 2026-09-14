import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://rootscion.com',
  server: {
    // Astro は PORT 環境変数を読まないので明示（プレビューの autoPort 用）
    port: Number(process.env.PORT) || 4321,
  },
});
