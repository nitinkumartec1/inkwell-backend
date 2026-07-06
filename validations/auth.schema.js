import { z } from 'zod';

export const firebaseAuthSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email(),
    profilePic: z.string().url().optional().or(z.literal('')),
    provider: z.string().optional(),
    username: z.string().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    bio: z.string().max(500).optional(),
    username: z.string().min(3).max(30).optional(),
  }),
});
