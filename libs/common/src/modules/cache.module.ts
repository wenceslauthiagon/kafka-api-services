import { CacheModuleOptions, DynamicModule, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';
import {
  CacheModule as NestCacheModule,
  CACHE_MANAGER,
} from '@nestjs/cache-manager';

export const InjectCache = () => Inject(CACHE_MANAGER);

export interface CacheConfig {
  APP_CACHE_TTL: number;
  APP_CACHE_MAX: number;
  APP_REDIS_HOST: string;
  APP_REDIS_PORT: number;
  APP_REDIS_TLS: string;
  APP_ENV: string;
}

export class CacheModule {
  static registerAsync(): DynamicModule {
    return NestCacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService<CacheConfig>,
      ): Promise<CacheModuleOptions> => {
        const options: CacheModuleOptions = {
          ttl: configService.get<number>('APP_CACHE_TTL', 60) * 1000,
          max: configService.get<number>('APP_CACHE_MAX', 100) * 1000,
        };

        // Is there a Redis server available?
        if (
          configService.get<string>('APP_ENV') === 'test' ||
          !configService.get<string>('APP_REDIS_HOST')
        ) {
          return options;
        }

        const hostname = configService.get<string>('APP_REDIS_HOST');
        const port = configService.get<number>('APP_REDIS_PORT', 6379);
        const tls = configService.get<string>('APP_REDIS_TLS', 'false');

        const redisOptions: any = {
          port,
          host: hostname,
        };

        if (tls === 'true') redisOptions.tls = {};

        options.store = await redisStore(redisOptions);

        return options;
      },
    });
  }
}
