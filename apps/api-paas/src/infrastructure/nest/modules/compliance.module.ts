import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '@zro/common';
import {
  CreateUserWithdrawSettingRequestRestController,
  GetUserWithdrawSettingRequestByIdController,
} from '@zro/api-paas/infrastructure';
import {
  CreateUserWithdrawSettingRequestServiceKafka,
  GetUserWithdrawSettingRequestByUserAndIdServiceKafka,
} from '@zro/compliance/infrastructure';

/**
 * Compliance endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([
      GetUserWithdrawSettingRequestByUserAndIdServiceKafka,
      CreateUserWithdrawSettingRequestServiceKafka,
    ]),
  ],
  controllers: [
    CreateUserWithdrawSettingRequestRestController,
    GetUserWithdrawSettingRequestByIdController,
  ],
})
export class ComplianceModule {}
