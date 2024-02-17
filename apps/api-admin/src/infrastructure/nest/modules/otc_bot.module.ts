import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule, LoggerModule, ValidationModule } from '@zro/common';
import {
  GetBotOtcAnalysisRestController,
  GetBotOtcOrderByIdRestController,
  GetAllBotOtcOrdersByFilterRestController,
  UpdateBotOtcRestController,
} from '@zro/api-admin/infrastructure';
import {
  GetAllBotOtcOrdersByFilterServiceKafka,
  GetBotOtcAnalysisServiceKafka,
  GetBotOtcOrderByIdServiceKafka,
  UpdateBotOtcServiceKafka,
} from '@zro/otc-bot/infrastructure';

/**
 * Otc Bot endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    KafkaModule.forFeature([
      GetBotOtcAnalysisServiceKafka,
      GetBotOtcOrderByIdServiceKafka,
      GetAllBotOtcOrdersByFilterServiceKafka,
      UpdateBotOtcServiceKafka,
    ]),
    ValidationModule,
  ],
  controllers: [
    GetBotOtcAnalysisRestController,
    GetBotOtcOrderByIdRestController,
    GetAllBotOtcOrdersByFilterRestController,
    UpdateBotOtcRestController,
  ],
})
export class OtcBotModule {}
