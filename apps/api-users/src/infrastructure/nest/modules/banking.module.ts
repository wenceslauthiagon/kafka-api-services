import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BcryptModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  GetAllBankRestController,
  GetAllBankTedRestController,
  GetBankingTedByIdRestController,
  CreateBankingTedRestController,
  GetAllBankingTedRestController,
  GetAllBankingContactRestController,
  DeleteBankingAccountContactRestController,
} from '@zro/api-users/infrastructure';
import {
  CreateBankingTedServiceKafka,
  DeleteBankingAccountContactServiceKafka,
  GetAllBankServiceKafka,
  GetAllBankTedServiceKafka,
  GetAllBankingContactServiceKafka,
  GetAllBankingTedServiceKafka,
  GetBankingTedByIdServiceKafka,
} from '@zro/banking/infrastructure';

/**
 * Banking endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    KafkaModule.forFeature([
      CreateBankingTedServiceKafka,
      DeleteBankingAccountContactServiceKafka,
      GetAllBankServiceKafka,
      GetAllBankTedServiceKafka,
      GetAllBankingContactServiceKafka,
      GetAllBankingTedServiceKafka,
      GetBankingTedByIdServiceKafka,
    ]),
    BcryptModule,
    ValidationModule,
  ],
  controllers: [
    GetAllBankRestController,
    GetAllBankTedRestController,
    GetAllBankingTedRestController,
    GetBankingTedByIdRestController,
    CreateBankingTedRestController,
    GetAllBankingContactRestController,
    DeleteBankingAccountContactRestController,
  ],
})
export class BankingModule {}
