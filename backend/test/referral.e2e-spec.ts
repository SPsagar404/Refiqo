import { INestApplication } from '@nestjs/common';
import { URL } from 'url';
import request from 'supertest';
import { createTestApp, uniqueEmail } from './setup-app';

const P = '/api/v1';

/**
 * Full cross-module flow against the seeded DB:
 * seeker signup → resume upload (StoragePort) → referral to seeded referrer →
 * referrer accepts → seeker receives a notification. Requires the seeded
 * referrer `priya@refiqo.com` (run `npm run prisma:seed` first).
 */
describe('Referral flow (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let seekerToken: string;
  let priyaToken: string;
  let priyaId: string;
  let resumeId: string;
  let referralId: string;

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());

    const seeker = await http
      .post(`${P}/auth/signup`)
      .send({ fullName: 'E2E Seeker', email: uniqueEmail('seeker'), password: 'Password@123' });
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

  it('uploads a resume via signed URL + confirm', async () => {
    const signed = await http
      .post(`${P}/files/upload-url`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({ kind: 'resume', fileName: 'cv.pdf', mimeType: 'application/pdf', sizeBytes: 8 })
      .expect(201);

    const path =
      new URL(signed.body.data.uploadUrl).pathname + new URL(signed.body.data.uploadUrl).search;
    await http
      .put(path)
      .set('Content-Type', 'application/pdf')
      .send(Buffer.from('%PDF-1.4'))
      .expect(200);

    const confirm = await http
      .post(`${P}/files/confirm`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        fileKey: signed.body.data.fileKey,
        fileName: 'cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 8,
      })
      .expect(201);
    resumeId = confirm.body.data.id;
    expect(resumeId).toBeDefined();
    expect(confirm.body.data.isPrimary).toBe(true);
  });

  it('rejects an oversized resume upload-url request', async () => {
    await http
      .post(`${P}/files/upload-url`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        kind: 'resume',
        fileName: 'big.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 99_000_000,
      })
      .expect(400);
  });

  it('creates a referral request to the referrer', async () => {
    const res = await http
      .post(`${P}/referrals`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        referrerId: priyaId,
        jobRole: 'Backend Developer',
        message: 'Please refer me!',
        resumeId,
      })
      .expect(201);
    referralId = res.body.data.id;
    expect(res.body.data.status).toBe('PENDING');
  });

  it('shows the request in the referrer incoming list', async () => {
    const res = await http
      .get(`${P}/referrals?role=referrer`)
      .set('Authorization', `Bearer ${priyaToken}`)
      .expect(200);
    expect(res.body.data.some((r: { id: string }) => r.id === referralId)).toBe(true);
  });

  it('lets the referrer accept the request', async () => {
    const res = await http
      .patch(`${P}/referrals/${referralId}/status`)
      .set('Authorization', `Bearer ${priyaToken}`)
      .send({ status: 'ACCEPTED' })
      .expect(200);
    expect(res.body.data.status).toBe('ACCEPTED');
  });

  it('blocks an invalid status transition (ACCEPTED → PENDING)', async () => {
    const res = await http
      .patch(`${P}/referrals/${referralId}/status`)
      .set('Authorization', `Bearer ${priyaToken}`)
      .send({ status: 'PENDING' })
      .expect(400);
    expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('forbids a stranger from changing the status', async () => {
    await http
      .patch(`${P}/referrals/${referralId}/status`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({ status: 'REJECTED', rejectionReason: 'x' })
      .expect(403);
  });

  it('fans out an acceptance notification to the seeker', async () => {
    const res = await http
      .get(`${P}/notifications`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .expect(200);
    expect(res.body.data[0].type).toBe('REFERRAL_ACCEPTED');
  });
});
