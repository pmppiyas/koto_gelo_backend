import z from 'zod/v3';

export const invitationQuerySchema = z.object({
  page: z.coerce
    .number({
      invalid_type_error: 'Page must be a number',
    })
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),

  limit: z.coerce
    .number({
      invalid_type_error: 'Limit must be a number',
    })
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),

  status: z
    .enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'], {
      invalid_type_error: 'Invalid invitation status',
    })
    .optional(),

  type: z
    .enum(['INVITATION', 'JOIN_REQUEST'], {
      invalid_type_error: 'Invalid invitation type',
    })
    .optional(),
});

export type InvitationQuery = z.infer<typeof invitationQuerySchema>;
