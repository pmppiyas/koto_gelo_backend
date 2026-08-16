import z from 'zod/v3';

export const createGroupSchema = z.object({
  name: z
    .string({
      required_error: 'Group name is required',
      invalid_type_error: 'Group name must be a string',
    })
    .trim()
    .min(1, 'Group name cannot be empty')
    .max(100, 'Group name cannot exceed 100 characters'),

  description: z
    .string({
      invalid_type_error: 'Description must be a string',
    })
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .nullable(),

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
    .optional()
    .default('OTHER'),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
