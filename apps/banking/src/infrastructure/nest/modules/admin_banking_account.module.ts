import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  AdminBankingAccountModel,
  GetAllAdminBankingAccountMicroserviceController,
} from '@zro/banking/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([AdminBankingAccountModel]),
  ],
  controllers: [GetAllAdminBankingAccountMicroserviceController],
  providers: [],
})
export class AdminBankingAccountdModule {}
