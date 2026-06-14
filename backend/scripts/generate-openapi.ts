/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';

/**
 * Emits the OpenAPI 3 spec to `contract/openapi.json` (+ `.yaml`) without
 * booting the server or touching the database. Run: `npm run openapi:generate`.
 * Import the JSON into Swagger Editor (editor.swagger.io), Postman, or Insomnia.
 */
async function generate() {
  // preview mode builds the route graph without instantiating providers (no DB connect).
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
    abortOnError: false,
  });
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Refiqo API')
    .setDescription('Refiqo REST API — referral networking platform')
    .setVersion('1.0')
    .addServer('http://localhost:4000', 'Local')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outDir = join(__dirname, '..', 'contract');
  mkdirSync(outDir, { recursive: true });

  const jsonPath = join(outDir, 'openapi.json');
  writeFileSync(jsonPath, JSON.stringify(document, null, 2), 'utf8');

  const pathCount = Object.keys(document.paths ?? {}).length;
  console.log(`OpenAPI spec written: ${jsonPath}`);
  console.log(`  paths: ${pathCount}`);

  await app.close();
  process.exit(0);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
