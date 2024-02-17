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
  CompanyModel,
  CompanyPolicyModel,
  GetCompanyByIdAndXApiKeyMicroserviceController,
} from '@zro/pix-zro-pay/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([CompanyModel, CompanyPolicyModel]),
  ],
  controllers: [GetCompanyByIdAndXApiKeyMicroserviceController],
  providers: [],
})
export class CompanyModule {}
