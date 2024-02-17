import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  TranslateModule,
  ValidationModule,
} from '@zro/common';
import { JiraModule, JiraComplianceModule } from '@zro/jira';
import {
  CloseUserWithdrawSettingRequestMicroserviceController,
  CreateUserWithdrawSettingRequestMicroserviceController,
  CreateApproveUserWithdrawSettingRequestMicroserviceController,
  GetUserWithdrawSettingRequestByUserAndIdMicroserviceController,
  HandleUserWithdrawSettingRequestFailedByDocumentNestObserver,
  HandleUserWithdrawSettingRequestPendingNestObserver,
  UserWithdrawSettingRequestModel,
  UserWithdrawSettingRequestStateChangeNotificationNestObserver,
} from '@zro/compliance/infrastructure';
import {
  CreateUserWithdrawSettingServiceKafka,
  GetAllUserWithdrawSettingServiceKafka,
} from '@zro/utils/infrastructure';
import { CreateDecodedPixKeyServiceKafka } from '@zro/pix-keys/infrastructure';
import {
  GetActiveTransactionTypeByTagServiceKafka,
  GetOperationByIdServiceKafka,
  GetUserWalletByUserAndWalletServiceKafka,
  GetWalletByUuidServiceKafka,
} from '@zro/operations/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      CreateUserWithdrawSettingServiceKafka,
      GetAllUserWithdrawSettingServiceKafka,
      CreateDecodedPixKeyServiceKafka,
      GetUserWalletByUserAndWalletServiceKafka,
      GetActiveTransactionTypeByTagServiceKafka,
      GetOperationByIdServiceKafka,
      GetWalletByUuidServiceKafka,
    ]),
    JiraModule,
    DatabaseModule.forFeature([UserWithdrawSettingRequestModel]),
    JiraComplianceModule,
    TranslateModule,
  ],
  controllers: [
    CreateUserWithdrawSettingRequestMicroserviceController,
    CreateApproveUserWithdrawSettingRequestMicroserviceController,
    GetUserWithdrawSettingRequestByUserAndIdMicroserviceController,
    CloseUserWithdrawSettingRequestMicroserviceController,
    HandleUserWithdrawSettingRequestPendingNestObserver,
    UserWithdrawSettingRequestStateChangeNotificationNestObserver,
    HandleUserWithdrawSettingRequestFailedByDocumentNestObserver,
  ],
})
export class UserWithdrawSettingRequestModule {}
