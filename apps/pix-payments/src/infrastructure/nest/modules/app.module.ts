import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BugReportModule,
  CacheModule,
  KafkaModule,
  LoggerModule,
  TranslateModule,
} from '@zro/common';
import { HealthModule } from './health.module';
import { PaymentModule } from './payment.module';
import { PixDepositModule } from './pix_deposit.module';
import { DecodedQrCodeModule } from './decoded_qr_code.module';
import { QrCodeStaticModule } from './qr_code_static.module';
import { PixDevolutionModule } from './pix_devolution.module';
import { WarningPixDevolutionModule } from './warning_pix_devolution.module';
import { DecodedPixAccountModule } from './decoded_pix_account.module';
import { PixDevolutionReceivedModule } from './pix_devolution_received.module';
import { PixInfractionModule } from './pix_infraction.module';
import { PixRefundModule } from './pix_refund.module';
import { QrCodeDynamicModule } from './qr_code_dynamic.module';
import { PixFraudDetectionModule } from './pix_fraud_detection.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.pix-payments.env'] }),
    CacheModule.registerAsync(),
    KafkaModule,
    LoggerModule,
    BugReportModule,
    TranslateModule,
    QrCodeStaticModule,
    PaymentModule,
    PixInfractionModule,
    PixDepositModule,
    DecodedQrCodeModule,
    PixDevolutionModule,
    PixDevolutionReceivedModule,
    DecodedPixAccountModule,
    PixRefundModule,
    QrCodeDynamicModule,
    WarningPixDevolutionModule,
    PixFraudDetectionModule,
    HealthModule,
  ],
  providers: [Logger],
})
export class AppModule {}
