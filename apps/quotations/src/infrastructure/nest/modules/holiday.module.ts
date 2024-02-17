import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  GetHolidayByDateMicroserviceController,
  CreateHolidayMicroserviceController,
  UpdateHolidayByIdMicroserviceController,
  HolidayModel,
} from '@zro/quotations/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([HolidayModel]),
  ],
  controllers: [
    GetHolidayByDateMicroserviceController,
    CreateHolidayMicroserviceController,
    UpdateHolidayByIdMicroserviceController,
  ],
})
export class HolidayModule {}
