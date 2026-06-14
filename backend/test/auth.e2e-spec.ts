import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, uniqueEmail } from './setup-app';

const P = '/api/v1';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  const email = uniqueEmail('auth');
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('signs up and returns tokens in the data envelope', async () => {
    const res = await http
      .post(`${P}/auth/signup`)
      .send({ fullName: 'E2E User', email, password: 'Password@123' })
      .expect(201);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.accessToken).toBeDefined();
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('rejects duplicate signup with 409', async () => {
    await http
      .post(`${P}/auth/signup`)
      .send({ fullName: 'Dupe', email, password: 'Password@123' })
      .expect(409);
  });

  it('rejects bad credentials with 401', async () => {
    await http.post(`${P}/auth/login`).send({ email, password: 'wrong-password' }).expect(401);
  });

  it('logs in with valid credentials', async () => {
    const res = await http
      .post(`${P}/auth/login`)
      .send({ email, password: 'Password@123' })
      .expect(201);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('blocks /auth/me without a token', async () => {
    await http.get(`${P}/auth/me`).expect(401);
  });

  it('returns the current user with a token', async () => {
    const res = await http
      .get(`${P}/auth/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.data.email).toBe(email);
    expect(res.body.data.onboardingComplete).toBe(false);
  });

  it('rotates the refresh token', async () => {
    const res = await http.post(`${P}/auth/refresh`).send({ refreshToken }).expect(201);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
  });

  it('rejects validation errors with the canonical envelope', async () => {
    const res = await http
      .post(`${P}/auth/signup`)
      .send({ email: 'nope', password: '1' })
      .expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.details)).toBe(true);
  });
});
