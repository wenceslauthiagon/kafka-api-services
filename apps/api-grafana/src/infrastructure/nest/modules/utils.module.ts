import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BcryptModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import { UpdateFeatureSettingStateRestController } from '@zro/api-grafana/infrastructure';
import { UpdateFeatureSettingStateServiceKafka } from '@zro/utils/infrastructure';

/**
 * Utils endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    KafkaModule.forFeature([UpdateFeatureSettingStateServiceKafka]),
    BcryptModule,
    ValidationModule,
  ],
  controllers: [UpdateFeatureSettingStateRestController],
})
export class UtilsModule {}
