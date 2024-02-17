import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  BcryptModule,
  KafkaModule,
  ValidationModule,
  JwtModule,
  LoggerModule,
} from '@zro/common';
import {
  LocalStrategy,
  JwtStrategy,
  LoginAuthRestController,
  AccessTokenProvider,
  JwtAuthGuard,
  RefreshTokenAuthRestController,
} from '@zro/api-paas/infrastructure';
import {
  GetUserApiKeyByIdServiceKafka,
  GetUserApiKeyByUserServiceKafka,
  GetUserByUuidServiceKafka,
  GetOnboardingByUserAndStatusIsFinishedServiceKafka,
} from '@zro/users/infrastructure';

/**
 * Authentication enpoints module.
 */
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync(),
    KafkaModule.forFeature([
      GetUserApiKeyByIdServiceKafka,
      GetUserApiKeyByUserServiceKafka,
      GetUserByUuidServiceKafka,
      GetOnboardingByUserAndStatusIsFinishedServiceKafka,
    ]),
    LoggerModule,
    PassportModule,
    BcryptModule,
    ValidationModule,
  ],
  controllers: [LoginAuthRestController, RefreshTokenAuthRestController],
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
