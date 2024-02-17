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
  StreamPairModel,
  LoadActiveStreamPairService,
  GetAllStreamPairMicroserviceController,
  GetStreamPairByIdMicroserviceController,
} from '@zro/quotations/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([StreamPairModel]),
    RedisModule,
  ],
  providers: [LoadActiveStreamPairService],
  controllers: [
    GetAllStreamPairMicroserviceController,
    GetStreamPairByIdMicroserviceController,
  ],
})
export class StreamPairModule {}
