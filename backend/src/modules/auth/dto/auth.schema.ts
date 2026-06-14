import { z } from 'zod';
import { emailSchema, passwordSchema } from '../../../contracts/common.schema';

export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: passwordSchema,
});
export type SignupDto = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const oauthSchema = z.object({
  idToken: z.string().min(1),
});
export type OAuthDto = z.infer<typeof oauthSchema>;

export const oauthProviderParamSchema = z.object({
  provider: z.enum(['google', 'linkedin', 'github']),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshDto = z.infer<typeof refreshSchema>;

export const logoutSchema = refreshSchema;
export type LogoutDto = RefreshDto;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
