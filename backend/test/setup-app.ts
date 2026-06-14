import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

/**
 * Boots the full application graph for e2e tests, mirroring main.ts
 * (global prefix so signed-URL paths match) against the configured DATABASE_URL.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  app.setGlobalPrefix('api/v1');
  await app.init();
  return app;
}

export const uniqueEmail = (tag: string) => `e2e_${tag}_${Date.now()}@refiqo.test`;
