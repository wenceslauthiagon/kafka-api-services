import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import {
  ApiKeyStrategy,
  ApiKeyAuthGuard,
} from '@zro/api-grafana/infrastructure';

@Module({
  imports: [PassportModule, ConfigModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyAuthGuard,
    },
    ApiKeyStrategy,
  ],
})
export class AuthModule {}
