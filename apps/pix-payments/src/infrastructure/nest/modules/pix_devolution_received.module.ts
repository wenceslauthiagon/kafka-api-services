import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  PixDevolutionReceivedModel,
  ReceivePixDevolutionReceivedMicroserviceController,
  GetPixDevolutionReceivedByOperationIdMicroserviceController,
  GetPixDevolutionReceivedByIdMicroserviceController,
  GetAllPixDevolutionReceivedMicroserviceController,
  GetAllPixDevolutionReceivedByWalletMicroserviceController,
} from '@zro/pix-payments/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([PixDevolutionReceivedModel]),
  ],
  controllers: [
    ReceivePixDevolutionReceivedMicroserviceController,
    GetPixDevolutionReceivedByOperationIdMicroserviceController,
    GetPixDevolutionReceivedByIdMicroserviceController,
    GetAllPixDevolutionReceivedMicroserviceController,
    GetAllPixDevolutionReceivedByWalletMicroserviceController,
  ],
})
export class PixDevolutionReceivedModule {}
