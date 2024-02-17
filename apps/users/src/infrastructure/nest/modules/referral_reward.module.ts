import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  ReferralRewardModel,
  SyncReferralRewardConversionCashbackCronService,
  CreateReferralRewardConversionCashbackNestObserver,
} from '@zro/users/infrastructure';
import {
  GetWalletByUuidServiceKafka,
  GetCurrencyByIdServiceKafka,
  GetOperationByIdServiceKafka,
  GetWalletByUserAndDefaultIsTrueServiceKafka,
  GetCurrencyBySymbolServiceKafka,
} from '@zro/operations/infrastructure';
import { CreateCashbackServiceKafka } from '@zro/otc/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      GetWalletByUuidServiceKafka,
      GetCurrencyByIdServiceKafka,
      GetOperationByIdServiceKafka,
      CreateCashbackServiceKafka,
      GetWalletByUserAndDefaultIsTrueServiceKafka,
      GetCurrencyBySymbolServiceKafka,
    ]),
    DatabaseModule.forFeature([ReferralRewardModel]),
  ],
  controllers: [CreateReferralRewardConversionCashbackNestObserver],
  providers: [SyncReferralRewardConversionCashbackCronService],
})
export class ReferralRewardModule {}
