import 'dotenv/config';
import z from 'zod/v3';

const envSchema = z.object({
  DATABASE_URL: z
    .string({
      required_error: 'DATABASE_URL is required',
    })
    .url('DATABASE_URL must be a valid URL'),

  DIRECT_URL: z
    .string({
      required_error: 'DIRECT_URL is required',
    })
    .url('DIRECT_URL must be a valid URL'),

  PASSWORD_SALT_ROUNDS: z
    .preprocess(
      (val) => (val ? Number(val) : undefined),
      z.number().int().min(4).max(31),
    )
    .default(12),
});

export const env = envSchema.parse(process.env);
