import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSecretRequestType } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import {
  BcryptModule,
  KafkaModule,
  LoggerModule,
  RecaptchaModule,
  ValidationModule,
} from '@zro/common';
import { AccessToken } from '@zro/api-users/domain';
import {
  LocalStrategy,
  V2LocalStrategy,
  JwtStrategy,
  LoginAuthRestController,
  AccessTokenProvider,
  JwtAuthGuard,
  JwtConfig,
  ChangeUserPasswordRestController,
  V2LoginAuthRestController,
  RefreshTokenAuthRestController,
  VerifyPinAuthRestController,
  ForgotPasswordRestController,
  V2ForgotPasswordRestController,
  UpdateForgotPasswordRestController,
  DeclineForgotPasswordRestController,
} from '@zro/api-users/infrastructure';
import {
  ChangeUserPasswordServiceKafka,
  CreateUserForgotPasswordByEmailServiceKafka,
  CreateUserForgotPasswordBySmsServiceKafka,
  DeclineUserForgotPasswordServiceKafka,
  GetOnboardingByUserAndStatusIsFinishedServiceKafka,
  GetUserByEmailServiceKafka,
  GetUserByDocumentServiceKafka,
  GetUserByPhoneNumberServiceKafka,
  GetUserByUuidServiceKafka,
  UpdateUserForgotPasswordServiceKafka,
} from '@zro/users/infrastructure';

const jwtModuleOptions = {
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService<JwtConfig>) => {
    const secret = configService.get<string>('APP_JWT_TOKEN');
    const expiresIn = configService.get<number>('APP_JWT_EXPIRES_IN', 3600);
    const extra = configService.get<string>('APP_JWT_TOKEN_V2_EXTRA', '');
    const v2PhoneNumbers = configService.get<string>(
      'APP_JWT_V2_EXTRA_PHONE_NUMBERS',
      '',
    );

    const secretOrKeyProvider = (
      requestType: JwtSecretRequestType,
      accessToken: AccessToken,
    ) => {
      if (v2PhoneNumbers.includes(accessToken.phone_number)) {
        return secret + extra;
      }
      return secret;
    };

    return {
      secret,
      secretOrKeyProvider,
      signOptions: {
        expiresIn,
      },
    };
  },
  inject: [ConfigService],
};

/**
 * Authentication enpoints module.
 */
@Module({
  imports: [
    ConfigModule,
    // This will use zro/common/libs/common/src/modules/jwt.module.ts
    // After signin, signup, and forgot password have been fixed.
    JwtModule.registerAsync(jwtModuleOptions),
    KafkaModule.forFeature([
      GetUserByUuidServiceKafka,
      GetUserByEmailServiceKafka,
      GetUserByDocumentServiceKafka,
      GetUserByPhoneNumberServiceKafka,
      ChangeUserPasswordServiceKafka,
      DeclineUserForgotPasswordServiceKafka,
      CreateUserForgotPasswordBySmsServiceKafka,
      CreateUserForgotPasswordByEmailServiceKafka,
      UpdateUserForgotPasswordServiceKafka,
      GetOnboardingByUserAndStatusIsFinishedServiceKafka,
    ]),
    LoggerModule,
    PassportModule,
    BcryptModule,
    ValidationModule,
    RecaptchaModule,
  ],
  controllers: [
    LoginAuthRestController,
    ChangeUserPasswordRestController,
    V2LoginAuthRestController,
    RefreshTokenAuthRestController,
    VerifyPinAuthRestController,
    ForgotPasswordRestController,
    V2ForgotPasswordRestController,
    UpdateForgotPasswordRestController,
    DeclineForgotPasswordRestController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    V2LocalStrategy,
    LocalStrategy,
    JwtStrategy,
    AccessTokenProvider,
  ],
})
export class AuthModule {}
