import { z } from 'zod';

export const storySchema = z.object({
  body: z.object({
    title: z.string().min(1).max(100),
    content: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    form: z.string().optional(),
    language: z.string().optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    scheduledAt: z.string().datetime().optional(),
  }),
});

export const updateStorySchema = z.object({
  body: z.object({
    title: z.string().min(1).max(100).optional(),
    content: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    form: z.string().optional(),
    language: z.string().optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    scheduledAt: z.string().datetime().optional(),
  }),
});
