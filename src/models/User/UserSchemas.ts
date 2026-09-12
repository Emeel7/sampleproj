import z from "zod";

export const EmailSchema = z.email();
export const PasswordSchema = z.string().trim().min(8);
export const UsernameSchema = z
  .string()
  .trim()
  .min(
    3,
    "Username must be at least 3 characters and contain only letters, numbers, and at most one underscore",
  )
  .regex(
    /^[A-Za-z0-9]+(?:_[A-Za-z0-9]+)?$/,
    "Username must be at least 3 characters and contain only letters, numbers, and at most one underscore",
  );
export const userSchema = z.object({
  username: UsernameSchema,
  email: EmailSchema,
  auth: z.object({
    password: PasswordSchema,
    sessionToken: z.string(),
  }),
});

export const userLookupSchema = z.object({
  userId: z.string(),
});

export const userFieldSchemas = {
  username: userSchema.shape.username,
  email: userSchema.shape.email,
  id: z.string(),
  "auth.sessionToken": userSchema.shape.auth.shape.sessionToken,
  "auth.password": userSchema.shape.auth.shape.password,
} as const;

export const newUserDetailsSchema = z.object({
  username: userFieldSchemas.username,
  email: userFieldSchemas.email,
  password: userFieldSchemas["auth.password"],
});

export const loginAttemptSchema = z.object({
  identifier: z.string(),
  password: userFieldSchemas["auth.password"],
});

export const userUpdateAttemptSchema = z.union([
  z.object({
    email: userFieldSchemas.email,
  }),
  z.object({
    username: userFieldSchemas.username,
  }),
]);

export const passwordUpdateAttemptSchema = z.object({
  oldPass: PasswordSchema,
  newPass: PasswordSchema,
});
