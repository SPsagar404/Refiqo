import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ConfigModule } from './config/config.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';
import { LookupsModule } from './modules/lookups/lookups.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { PushModule } from './modules/push/push.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { ReferralModule } from './modules/referral/referral.module';
import { ReferrersModule } from './modules/referrers/referrers.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { SkillsModule } from './modules/skills/skills.module';
import { StorageModule } from './modules/storage/storage.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get('isProd') ? 'info' : 'debug',
          transport: config.get('isProd')
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
          redact: ['req.headers.authorization', 'req.headers.cookie'],
          autoLogging: true,
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: (config.get<number>('throttle.ttl') ?? 10) * 1000,
            limit: config.get<number>('throttle.limit') ?? 10,
          },
        ],
      }),
    }),
    LookupsModule,
    StorageModule,
    PushModule,
    RealtimeModule,
    AuthModule,
    SkillsModule,
    FilesModule,
    OnboardingModule,
    UsersModule,
    ReferrersModule,
    JobsModule,
    NotificationsModule,
    ReferralModule,
    ChatModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    // Order matters: auth → roles → throttle run as guards; filter/interceptors are global.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
