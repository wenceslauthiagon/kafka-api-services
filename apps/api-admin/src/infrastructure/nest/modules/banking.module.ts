import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '@zro/common';
import {
  GetAllBankRestController,
  UpdateBankRestController,
  CreateAdminBankingTedRestController,
  GetAllBankingAccountRestController,
  GetAllBankingTedRestController,
  GetBankingTedByIdRestController,
} from '@zro/api-admin/infrastructure';
import {
  CreateAdminBankingTedServiceKafka,
  GetAllBankServiceKafka,
  GetAllAdminBankingAccountServiceKafka,
  GetAllAdminBankingTedServiceKafka,
  GetAdminBankingTedByIdServiceKafka,
  UpdateBankServiceKafka,
} from '@zro/banking/infrastructure';

/**
 * Banking endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([
      CreateAdminBankingTedServiceKafka,
      GetAllBankServiceKafka,
      GetAllAdminBankingAccountServiceKafka,
      GetAllAdminBankingTedServiceKafka,
      GetAdminBankingTedByIdServiceKafka,
      UpdateBankServiceKafka,
    ]),
  ],
  controllers: [
    GetAllBankRestController,
    GetAllBankingAccountRestController,
    GetAllBankingTedRestController,
    GetBankingTedByIdRestController,
    CreateAdminBankingTedRestController,
    UpdateBankRestController,
  ],
})
export class BankingModule {}
