import z from 'zod/v3';

export const groupDepositQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val === undefined || val === '' || val === null ? 1 : Number(val)),
    z.number().int().min(1).default(1),
  ),

  limit: z.preprocess(
    (val) =>
      val === undefined || val === '' || val === null ? 50 : Number(val),
    z.number().int().min(1).max(100).default(50),
  ),

  groupId: z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined ? undefined : val,
    z.string().uuid('Group ID must be a valid UUID').optional(),
  ),

  userId: z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined ? undefined : val,
    z.string().uuid('User ID must be a valid UUID').optional(),
  ),

  method: z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined ? undefined : val,
    z.enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK', 'OTHER']).optional(),
  ),

  status: z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined ? undefined : val,
    z.enum(['ACTIVE', 'CANCELLED']).optional(),
  ),

  from: z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined
        ? undefined
        : new Date(val as string),
    z.date().optional(),
  ),

  to: z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined
        ? undefined
        : new Date(val as string),
    z.date().optional(),
  ),

  search: z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined ? undefined : val,
    z.string().trim().max(100).optional(),
  ),
});

export type GroupDepositQuery = z.infer<typeof groupDepositQuerySchema>;
