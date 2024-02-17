import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BcryptModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  CreateConversionRestController,
  GetCryptoReportByCurrencyAndFormatRestController,
  DownloadFileByIdRestController,
} from '@zro/api-users/infrastructure';
import {
  CreateConversionServiceKafka,
  GetCryptoReportByCurrencyAndFormatServiceKafka,
} from '@zro/otc/infrastructure';

/**
 * Otc endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    KafkaModule.forFeature([
      CreateConversionServiceKafka,
      GetCryptoReportByCurrencyAndFormatServiceKafka,
    ]),
    BcryptModule,
    ValidationModule,
  ],
  controllers: [
    CreateConversionRestController,
    GetCryptoReportByCurrencyAndFormatRestController,
    DownloadFileByIdRestController,
  ],
})
export class OtcModule {}
