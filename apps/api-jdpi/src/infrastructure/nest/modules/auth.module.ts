import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import {
  JwtModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  AccessTokenProvider,
  JwtStrategy,
  LoginAuthRestController,
  JwtAuthGuard,
  LocalStrategy,
} from '@zro/api-jdpi/infrastructure';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync(),
    KafkaModule.forFeature(),
    LoggerModule,
    PassportModule,
    ValidationModule,
  ],
  controllers: [LoginAuthRestController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    LocalStrategy,
    JwtStrategy,
    AccessTokenProvider,
  ],
})
export class AuthModule {}
