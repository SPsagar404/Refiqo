import { loginSchema, signupSchema } from './auth.schema';

describe('auth DTO schemas', () => {
  it('accepts a valid signup and normalises email casing', () => {
    const parsed = signupSchema.parse({
      fullName: 'Aarav Sharma',
      email: 'Aarav@Example.COM',
      password: 'Password@123',
    });
    expect(parsed.email).toBe('aarav@example.com');
  });

  it('rejects short passwords', () => {
    expect(() =>
      signupSchema.parse({ fullName: 'Aarav', email: 'a@b.com', password: 'short' }),
    ).toThrow();
  });

  it('rejects malformed email on login', () => {
    expect(() => loginSchema.parse({ email: 'not-an-email', password: 'x' })).toThrow();
  });
});
