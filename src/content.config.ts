import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    year: z.number(),
    role: z.string(),
    stack: z.array(z.string()),
    url: z.string().url().optional(),
    order: z.number().default(0),
    /* true の間は一覧にも詳細ページにも出さない。
       実績が揃ったら false にする（Nº03 Works は公開分が0件なら「準備中」を出す） */
    draft: z.boolean().default(false),
  }),
});

export const collections = { works };
