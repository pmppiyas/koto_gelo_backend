import z from 'zod/v3';

export const payerInputSchema = z.object({
  userId: z
    .string({
      required_error: 'Payer user ID is required',
      invalid_type_error: 'Payer user ID must be a string',
    })
    .uuid('Payer user ID must be a valid UUID'),

  amount: z
    .number({
      required_error: 'Paid amount is required',
      invalid_type_error: 'Paid amount must be a number',
    })
    .positive('Paid amount must be greater than 0')
    .finite('Paid amount must be a valid number'),
});

export const participantInputSchema = z.object({
  userId: z
    .string({
      required_error: 'Participant user ID is required',
      invalid_type_error: 'Participant user ID must be a string',
    })
    .uuid('Participant user ID must be a valid UUID'),

  shareAmount: z
    .number({
      invalid_type_error: 'Share amount must be a number',
    })
    .positive('Share amount must be greater than 0')
    .finite('Share amount must be a valid number')
    .optional(),

  percentage: z
    .number({
      invalid_type_error: 'Percentage must be a number',
    })
    .positive('Percentage must be greater than 0')
    .max(100, 'Percentage cannot exceed 100')
    .optional(),

  shares: z
    .number({
      invalid_type_error: 'Shares must be a number',
    })
    .int('Shares must be an integer')
    .positive('Shares must be greater than 0')
    .optional(),
});

export const createGroupExpenseSchema = z.object({
  groupId: z
    .string({
      required_error: 'Group ID is required',
      invalid_type_error: 'Group ID must be a string',
    })
    .uuid('Group ID must be a valid UUID'),

  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than 0')
    .finite('Amount must be a valid number'),

  category: z
    .string({
      required_error: 'Category is required',
      invalid_type_error: 'Category must be a string',
    })
    .trim()
    .min(1, 'Category cannot be empty')
    .max(100, 'Category cannot exceed 100 characters'),

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
      required_error: 'Expense date is required',
      invalid_type_error: 'Invalid expense date',
    })
    .refine((date) => !Number.isNaN(date.getTime()), 'Invalid expense date'),

  splitType: z
    .enum(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES'], {
      invalid_type_error: 'Invalid split type',
    })
    .default('EQUAL'),

  payers: z.array(payerInputSchema).optional(),

  participants: z.array(participantInputSchema).optional(),
});

export type PayerInput = z.infer<typeof payerInputSchema>;
export type ParticipantInput = z.infer<typeof participantInputSchema>;
export type CreateGroupExpenseInput = z.infer<typeof createGroupExpenseSchema>;
