import z from 'zod/v3';

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({
      required_error: 'Refresh token is required',
      invalid_type_error: 'Refresh token must be a string',
    })
    .trim()
    .min(1, 'Refresh token cannot be empty'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
