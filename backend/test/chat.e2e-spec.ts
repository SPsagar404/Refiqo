import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, uniqueEmail } from './setup-app';

const P = '/api/v1';

describe('Chat (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let seekerToken: string;
  let priyaToken: string;
  let priyaId: string;
  let conversationId: string;

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());

    const seeker = await http
      .post(`${P}/auth/signup`)
      .send({ fullName: 'E2E Chatter', email: uniqueEmail('chat'), password: 'Password@123' });
    seekerToken = seeker.body.data.accessToken;

    const priya = await http
      .post(`${P}/auth/login`)
      .send({ email: 'priya@refiqo.com', password: 'Password@123' });
    priyaToken = priya.body.data.accessToken;
    priyaId = priya.body.data.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('get-or-creates a conversation idempotently', async () => {
    const a = await http
      .post(`${P}/conversations`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({ participantId: priyaId })
      .expect(201);
    const b = await http
      .post(`${P}/conversations`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({ participantId: priyaId })
      .expect(201);
    conversationId = a.body.data.id;
    expect(b.body.data.id).toBe(conversationId);
  });

  it('sends a message and surfaces it in the referrer thread list with an unread count', async () => {
    await http
      .post(`${P}/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({ body: 'Hi Priya!', type: 'TEXT' })
      .expect(201);

    const threads = await http
      .get(`${P}/conversations`)
      .set('Authorization', `Bearer ${priyaToken}`)
      .expect(200);
    const thread = threads.body.data.find((t: { id: string }) => t.id === conversationId);
    expect(thread.lastMessage.body).toBe('Hi Priya!');
    expect(thread.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it('marks the conversation read, zeroing the unread count', async () => {
    await http
      .post(`${P}/conversations/${conversationId}/read`)
      .set('Authorization', `Bearer ${priyaToken}`)
      .expect(201);

    const threads = await http
      .get(`${P}/conversations`)
      .set('Authorization', `Bearer ${priyaToken}`)
      .expect(200);
    const thread = threads.body.data.find((t: { id: string }) => t.id === conversationId);
    expect(thread.unreadCount).toBe(0);
  });

  it('paginates message history', async () => {
    const res = await http
      .get(`${P}/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('denies access to a conversation the user is not part of', async () => {
    const stranger = await http
      .post(`${P}/auth/signup`)
      .send({ fullName: 'Nosy', email: uniqueEmail('nosy'), password: 'Password@123' });
    await http
      .get(`${P}/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${stranger.body.data.accessToken}`)
      .expect(404);
  });
});
