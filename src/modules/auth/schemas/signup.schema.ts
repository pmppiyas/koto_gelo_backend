import z from 'zod/v3';

export const signupSchema = z.object({
  username: z
    .string({
      required_error: 'Username is required',
      invalid_type_error: 'Username must be string',
    })
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(
      /^[a-z0-9_]+$/,
      'Username can only contain lowercase letters, numbers, and underscore',
    ),

  email: z
    .string({
      invalid_type_error: 'Email must be a string',
    })
    .trim()
    .email('Invalid email format')
    .optional(),

  phone: z
    .string({
      invalid_type_error: 'Phone must be a string',
    })
    .trim()
    .optional(),

  password: z
    .string({
      required_error: 'Password is required',
      invalid_type_error: 'Password must be a string',
    })
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password cannot exceed 100 characters'),
});

export type SignupInput = z.infer<typeof signupSchema>;
