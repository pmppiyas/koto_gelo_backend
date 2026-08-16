import z from 'zod/v3';

export const settlePaymentSchema = z.object({
  groupId: z
    .string({
      invalid_type_error: 'Group ID must be a string',
    })
    .uuid('Group ID must be a valid UUID')
    .optional(),

  payerId: z
    .string({
      required_error: 'Payer ID is required',
      invalid_type_error: 'Payer ID must be a string',
    })
    .uuid('Payer ID must be a valid UUID'),

  receiverId: z
    .string({
      required_error: 'Receiver ID is required',
      invalid_type_error: 'Receiver ID must be a string',
    })
    .uuid('Receiver ID must be a valid UUID'),

  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than 0')
    .finite('Amount must be a valid number'),

  accountId: z
    .string({
      invalid_type_error: 'Account ID must be a string',
    })
    .uuid('Account ID must be a valid UUID')
    .optional()
    .nullable(),

  note: z
    .string({
      invalid_type_error: 'Note must be a string',
    })
    .trim()
    .max(500, 'Note cannot exceed 500 characters')
    .optional()
    .nullable(),

  expenseDate: z.coerce
    .date({
      invalid_type_error: 'Invalid expense date',
    })
    .optional()
    .default(() => new Date()),
});

export type SettlePaymentInput = z.infer<typeof settlePaymentSchema>;
