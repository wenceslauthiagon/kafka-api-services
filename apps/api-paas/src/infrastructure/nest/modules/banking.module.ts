import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BcryptModule, KafkaModule, ValidationModule } from '@zro/common';
import {
  GetAllBankTedRestController,
  GetBankingTedByIdRestController,
  CreateBankingTedRestController,
  GetAllBankingTedRestController,
} from '@zro/api-paas/infrastructure';
import {
  CreateBankingTedServiceKafka,
  GetAllBankTedServiceKafka,
  GetAllBankingTedServiceKafka,
  GetBankingTedByIdServiceKafka,
} from '@zro/banking/infrastructure';

/**
 * Banking endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([
      CreateBankingTedServiceKafka,
      GetAllBankTedServiceKafka,
      GetAllBankingTedServiceKafka,
      GetBankingTedByIdServiceKafka,
    ]),
    BcryptModule,
    ValidationModule,
  ],
  controllers: [
    GetAllBankTedRestController,
    GetAllBankingTedRestController,
    GetBankingTedByIdRestController,
    CreateBankingTedRestController,
  ],
})
export class BankingModule {}
