import z from 'zod/v3';

export const personalExpenseQuerySchema = z.object({
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

  category: z
    .string({
      invalid_type_error: 'Category must be a string',
    })
    .trim()
    .optional(),

  subcategory: z
    .string({
      invalid_type_error: 'Subcategory must be a string',
    })
    .trim()
    .optional(),

  accountId: z
    .string({
      invalid_type_error: 'Account ID must be a string',
    })
    .uuid('Account ID must be a valid UUID')
    .optional(),

  status: z
    .enum(['ACTIVE', 'CANCELLED'], {
      invalid_type_error: 'Status must be either ACTIVE or CANCELLED',
    })
    .optional(),

  from: z.coerce
    .date({
      invalid_type_error: 'Invalid from date',
    })
    .optional(),

  to: z.coerce
    .date({
      invalid_type_error: 'Invalid to date',
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

export type PersonalExpenseQuery = z.infer<typeof personalExpenseQuerySchema>;
