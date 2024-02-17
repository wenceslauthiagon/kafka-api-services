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
  CreateQrCodeMicroserviceController,
  CreateTransactionQrCodeNestObserver,
  LoadGetPaymentGatewayService,
} from '@zro/pix-zro-pay/infrastructure';
import { AsaasPixModule } from '@zro/asaas';
import { GenialPixModule } from '@zro/genial';
import { ZroBankPixModule } from '@zro/zrobank';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    DatabaseModule.forFeature([]),
    ValidationModule,
    KafkaModule.forFeature(),
    AsaasPixModule,
    GenialPixModule,
    ZroBankPixModule,
  ],
  controllers: [
    CreateQrCodeMicroserviceController,
    CreateTransactionQrCodeNestObserver,
  ],
  providers: [LoadGetPaymentGatewayService],
})
export class QrCodeModule {}
