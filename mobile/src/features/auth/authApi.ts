import { api, unwrap } from '@/lib/apiClient';
import { AuthResponse } from '@/types/models';
import { LoginForm, SignupForm } from '@/types/schemas';

export async function login(body: LoginForm): Promise<AuthResponse> {
  return unwrap<AuthResponse>((await api.post('/auth/login', body)).data);
}

export async function signup(body: SignupForm): Promise<AuthResponse> {
  return unwrap<AuthResponse>((await api.post('/auth/signup', body)).data);
}

export async function forgotPassword(email: string): Promise<{ success: boolean }> {
  return unwrap<{ success: boolean }>((await api.post('/auth/forgot-password', { email })).data);
}
