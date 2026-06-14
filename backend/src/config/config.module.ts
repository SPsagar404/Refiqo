import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configuration } from './configuration';
import { validateEnv } from './env.validation';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: (raw) => {
        const env = validateEnv(raw);
        // Expose both the raw validated env and the namespaced config.
        return { ...env, ...configuration(env) };
      },
    }),
  ],
})
export class ConfigModule {}
