import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule, LoggerModule } from '@zro/common';
import {
  GetAllPixKeyRestController,
  GetHistoryPixKeyRestController,
  GetAllPixKeyServiceKafka,
  GetHistoryPixKeyServiceKafka,
} from '@zro/api-admin/infrastructure';

/**
 * PixKey endpoint modules.
 */
@Module({
  imports: [ConfigModule, LoggerModule, KafkaModule.forFeature()],
  providers: [GetHistoryPixKeyServiceKafka, GetAllPixKeyServiceKafka],
  controllers: [GetHistoryPixKeyRestController, GetAllPixKeyRestController],
})
export class PixKeyModule {}
