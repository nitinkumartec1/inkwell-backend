import { z } from 'zod';

export const firebaseAuthSchema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().optional(),
    username: z.string().optional(),
    profilePic: z.string().url().optional().or(z.literal('')),
    provider: z.string().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    username: z.string().min(3).max(30).optional(),
    bio: z.string().max(300).optional(),
  }),
});

export const createStorySchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(100),
    content: z.string().min(1, 'Content is required'),
    description: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    form: z.string().optional(),
    language: z.string().optional(),
    tags: z.any().optional(), // Can be string or array
    scheduledAt: z.string().datetime().optional(),
  }),
});

export const updateStorySchema = z.object({
  body: z.object({
    title: z.string().min(1).max(100).optional(),
    content: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    form: z.string().optional(),
    language: z.string().optional(),
    tags: z.any().optional(),
    scheduledAt: z.string().datetime().optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  }),
});

export const usernameParamSchema = z.object({
  params: z.object({
    username: z.string().min(1),
  }),
});

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
    tag: z.string().optional(),
    form: z.string().optional(),
    language: z.string().optional(),
  }),
});
