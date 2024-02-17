import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import { TopazioKycModule } from '@zro/topazio';
import {
  DecodedPixAccountModel,
  CreateDecodedPixAccountMicroserviceController,
} from '@zro/pix-payments/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([DecodedPixAccountModel]),
    TopazioKycModule,
  ],
  controllers: [CreateDecodedPixAccountMicroserviceController],
})
export class DecodedPixAccountModule {}
