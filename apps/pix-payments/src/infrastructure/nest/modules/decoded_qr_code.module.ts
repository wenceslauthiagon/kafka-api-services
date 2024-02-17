import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import { JdpiPixModule } from '@zro/jdpi';
import {
  DecodedQrCodeModel,
  CreateDecodedQrCodeMicroserviceController,
} from '@zro/pix-payments/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([DecodedQrCodeModel]),
    JdpiPixModule,
  ],
  controllers: [CreateDecodedQrCodeMicroserviceController],
})
export class DecodedQrCodeModule {}
