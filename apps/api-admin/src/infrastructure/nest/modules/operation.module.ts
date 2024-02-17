import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '@zro/common';
import {
  GetAllCurrencyRestController,
  GetUserLimitsByUserIdRestController,
  UpdateUserLimitByAdminRestController,
} from '@zro/api-admin/infrastructure';
import { GetAllCurrencyServiceKafka } from '@zro/operations/infrastructure';

/**
 * Operation endpoint modules.
 */
@Module({
  imports: [ConfigModule, KafkaModule.forFeature([GetAllCurrencyServiceKafka])],
  providers: [],
  controllers: [
    GetAllCurrencyRestController,
    GetUserLimitsByUserIdRestController,
    UpdateUserLimitByAdminRestController,
  ],
})
export class OperationModule {}
