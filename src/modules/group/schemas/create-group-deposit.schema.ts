import z from 'zod/v3';

export const createGroupDepositSchema = z.object({
  groupId: z
    .string({
      required_error: 'Group ID is required',
      invalid_type_error: 'Group ID must be a string',
    })
    .uuid('Group ID must be a valid UUID'),

  userId: z
    .string({
      required_error: 'Member user ID is required',
      invalid_type_error: 'Member user ID must be a string',
    })
    .uuid('Member user ID must be a valid UUID'),

  amount: z
    .number({
      required_error: 'Deposit amount is required',
      invalid_type_error: 'Deposit amount must be a number',
    })
    .positive('Deposit amount must be greater than 0')
    .max(10000000, 'Deposit amount is too large'),

  depositDate: z.coerce
    .date({
      invalid_type_error: 'Invalid deposit date',
    })
    .optional()
    .default(() => new Date()),

  method: z
    .enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK', 'OTHER'], {
      invalid_type_error: 'Invalid payment method',
    })
    .optional()
    .default('CASH'),

  note: z
    .string({
      invalid_type_error: 'Note must be a string',
    })
    .trim()
    .max(500, 'Note cannot exceed 500 characters')
    .optional()
    .nullable(),
});

export type CreateGroupDepositInput = z.infer<typeof createGroupDepositSchema>;
