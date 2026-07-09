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
  }),
});

export const collections = { works };
