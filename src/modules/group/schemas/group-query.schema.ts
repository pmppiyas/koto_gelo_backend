import z from 'zod/v3';

export const groupQuerySchema = z.object({
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

  type: z
    .enum(
      [
        'MESS',
        'FRIENDS',
        'TOUR',
        'TRIP',
        'FAMILY',
        'OFFICE',
        'STUDENTS',
        'ROOMMATES',
        'OTHER',
      ],
      {
        invalid_type_error: 'Invalid group type',
      },
    )
    .optional(),

  status: z
    .enum(['ACTIVE', 'ARCHIVED'], {
      invalid_type_error: 'Status must be either ACTIVE or ARCHIVED',
    })
    .optional(),

  search: z
    .string({
      invalid_type_error: 'Search term must be a string',
    })
    .trim()
    .max(100, 'Search term cannot exceed 100 characters')
    .optional(),
});

export type GroupQuery = z.infer<typeof groupQuerySchema>;
