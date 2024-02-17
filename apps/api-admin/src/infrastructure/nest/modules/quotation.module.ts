import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule, LoggerModule, ValidationModule } from '@zro/common';
import {
  CreateHolidayRestController,
  UpdateHolidayByIdRestController,
} from '@zro/api-admin/infrastructure';
import {
  CreateHolidayServiceKafka,
  UpdateHolidayByIdServiceKafka,
} from '@zro/quotations/infrastructure';

/**
 * Quotations endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    KafkaModule.forFeature([
      CreateHolidayServiceKafka,
      UpdateHolidayByIdServiceKafka,
    ]),
    ValidationModule,
  ],
  controllers: [CreateHolidayRestController, UpdateHolidayByIdRestController],
})
export class QuotationModule {}
