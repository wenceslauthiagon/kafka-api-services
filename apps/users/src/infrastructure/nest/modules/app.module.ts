import { ConfigModule } from '@nestjs/config';
import { Logger, Module } from '@nestjs/common';
import {
  BcryptModule,
  BugReportModule,
  CacheModule,
  LoggerModule,
} from '@zro/common';
import { UserModule } from './user.module';
import { HealthModule } from './health.module';
import { OnboardingModule } from './onboarding.module';
import { UserPinAttemptModule } from './user_pin_attempt.module';
import { UserApiKeyModule } from './user_api_key.module';
import { ReferralRewardModule } from './referral_reward.module';
import { UserForgotPasswordModule } from './user_forgot_password.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.users.env'] }),
    CacheModule.registerAsync(),
    LoggerModule,
    BugReportModule,
    BcryptModule,
    UserModule,
    OnboardingModule,
    UserPinAttemptModule,
    UserApiKeyModule,
    ReferralRewardModule,
    UserForgotPasswordModule,
    HealthModule,
  ],
  providers: [Logger],
})
export class AppModule {}
