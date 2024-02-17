import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '@zro/common';
import {
  CreateUserLimitRequestRestController,
  CreateUserWithdrawSettingRequestRestController,
  GetUserWithdrawSettingRequestByIdController,
} from '@zro/api-users/infrastructure';
import {
  GetUserWithdrawSettingRequestByUserAndIdServiceKafka,
  CreateApproveUserWithdrawSettingRequestServiceKafka,
  CreateUserLimitRequestServiceKafka,
} from '@zro/compliance/infrastructure';

/**
 * Compliance endpoint modules.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([
      GetUserWithdrawSettingRequestByUserAndIdServiceKafka,
      CreateApproveUserWithdrawSettingRequestServiceKafka,
      CreateUserLimitRequestServiceKafka,
    ]),
  ],
  controllers: [
    CreateUserLimitRequestRestController,
    CreateUserWithdrawSettingRequestRestController,
    GetUserWithdrawSettingRequestByIdController,
  ],
})
export class ComplianceModule {}
