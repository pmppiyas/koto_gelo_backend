import z from 'zod/v3';

export const updatePersonalExpenseSchema = z.object({
  amount: z
    .number({
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than 0')
    .finite('Amount must be a valid number')
    .optional(),

  category: z
    .string({
      invalid_type_error: 'Category must be a string',
    })
    .trim()
    .min(1, 'Category cannot be empty')
    .max(100, 'Category cannot exceed 100 characters')
    .optional(),

  subcategory: z
    .string({
      invalid_type_error: 'Subcategory must be a string',
    })
    .trim()
    .min(1, 'Subcategory cannot be empty')
    .max(100, 'Subcategory cannot exceed 100 characters')
    .optional()
    .nullable(),

  accountId: z
    .string({
      invalid_type_error: 'Account ID must be a string',
    })
    .uuid('Account ID must be a valid UUID')
    .optional()
    .nullable(),

  title: z
    .string({
      invalid_type_error: 'Title must be a string',
    })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title cannot exceed 255 characters')
    .optional()
    .nullable(),

  note: z
    .string({
      invalid_type_error: 'Note must be a string',
    })
    .trim()
    .max(1000, 'Note cannot exceed 1000 characters')
    .optional()
    .nullable(),

  expenseDate: z.coerce
    .date({
      invalid_type_error: 'Invalid expense date',
    })
    .refine((date) => !Number.isNaN(date.getTime()), 'Invalid expense date')
    .optional(),

  status: z
    .enum(['ACTIVE', 'CANCELLED'], {
      invalid_type_error: 'Status must be either ACTIVE or CANCELLED',
    })
    .optional(),
});

export type UpdatePersonalExpenseInput = z.infer<
  typeof updatePersonalExpenseSchema
>;
