import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

interface RateLimitConfig {
  APP_GLOBAL_THROTTLE_TTL: string;
  APP_GLOBAL_THROTTLE_LIMIT: string;
}

const getRateLimitOptions = (configService: ConfigService<RateLimitConfig>) => {
  return {
    ttl: configService.get('APP_GLOBAL_THROTTLE_TTL'),
    limit: configService.get('APP_GLOBAL_THROTTLE_LIMIT'),
  };
};

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getRateLimitOptions,
    }),
  ],
})
export class RateLimitModule {}
