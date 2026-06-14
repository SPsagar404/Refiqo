import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>('apiPrefix') ?? 'api/v1';

  app.setGlobalPrefix(apiPrefix);
  app.use(helmet());
  app.enableCors({
    origin: config.get<string[]>('cors.origins'),
    credentials: true,
  });
  // class-validator pipe for any class DTOs; Zod handles the rest via ZodValidationPipe.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();

  // Swagger interactive docs at /docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Refiqo API')
    .setDescription('Refiqo REST API — referral networking platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>('port') ?? 4000;
  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(`Refiqo API ready on http://localhost:${port}/${apiPrefix} (docs: /docs)`);
}

void bootstrap();
