import z from 'zod/v3';

export const createInvitationSchema = z
  .object({
    inviteeId: z
      .string({
        invalid_type_error: 'Invitee ID must be a string',
      })
      .uuid('Invitee ID must be a valid UUID')
      .optional(),

    username: z
      .string({
        invalid_type_error: 'Username must be a string',
      })
      .trim()
      .toLowerCase()
      .optional(),

    email: z
      .string({
        invalid_type_error: 'Email must be a string',
      })
      .trim()
      .email('Invalid email format')
      .optional(),
  })
  .refine(
    (data) => Boolean(data.inviteeId || data.username || data.email),
    'Either inviteeId, username, or email must be provided',
  );

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
