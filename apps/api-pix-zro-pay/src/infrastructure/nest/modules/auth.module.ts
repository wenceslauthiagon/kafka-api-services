import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { KafkaModule, LoggerModule, RedisModule } from '@zro/common';
import {
  ApiKeyStrategy,
  ApiKeyAuthGuard,
} from '@zro/api-pix-zro-pay/infrastructure';
import { GetCompanyByIdAndXApiKeyServiceKafka } from '@zro/pix-zro-pay/infrastructure';

@Module({
  imports: [
    PassportModule,
    RedisModule,
    KafkaModule.forFeature([GetCompanyByIdAndXApiKeyServiceKafka]),
    LoggerModule,
    ConfigModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyAuthGuard,
    },
    ApiKeyStrategy,
  ],
})
export class AuthModule {}
