import z from 'zod/v3';

export const updateGroupDepositSchema = z.object({
  userId: z
    .string({
      invalid_type_error: 'Member user ID must be a string',
    })
    .uuid('Member user ID must be a valid UUID')
    .optional(),

  amount: z
    .number({
      invalid_type_error: 'Deposit amount must be a number',
    })
    .positive('Deposit amount must be greater than 0')
    .max(10000000, 'Deposit amount is too large')
    .optional(),

  depositDate: z.coerce
    .date({
      invalid_type_error: 'Invalid deposit date',
    })
    .optional(),

  method: z
    .enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK', 'OTHER'], {
      invalid_type_error: 'Invalid payment method',
    })
    .optional(),

  note: z
    .string({
      invalid_type_error: 'Note must be a string',
    })
    .trim()
    .max(500, 'Note cannot exceed 500 characters')
    .optional()
    .nullable(),

  status: z
    .enum(['ACTIVE', 'CANCELLED'], {
      invalid_type_error: 'Invalid deposit status',
    })
    .optional(),
});

export type UpdateGroupDepositInput = z.infer<typeof updateGroupDepositSchema>;
