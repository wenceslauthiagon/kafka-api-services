import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  RedisModule,
  ValidationModule,
} from '@zro/common';
import {
  GetAllTaxMicroserviceController,
  LoadActiveTaxService,
  TaxModel,
} from '@zro/quotations/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([TaxModel]),
    RedisModule,
  ],
  providers: [LoadActiveTaxService],
  controllers: [GetAllTaxMicroserviceController],
})
export class TaxModule {}
