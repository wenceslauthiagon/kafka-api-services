import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  FeatureSettingModel,
  GetFeatureSettingByNameMicroserviceController,
  UpdateFeatureSettingStateMicroserviceController,
} from '@zro/utils/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([FeatureSettingModel]),
  ],
  controllers: [
    GetFeatureSettingByNameMicroserviceController,
    UpdateFeatureSettingStateMicroserviceController,
  ],
})
export class FeatureSettingModule {}
