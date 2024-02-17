import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  BcryptModule,
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  RedisModule,
  ValidationModule,
} from '@zro/common';
import {
  GetUserByPhoneNumberMicroserviceController,
  GetUserByUuidMicroserviceController,
  UpdateUserPropsMicroserviceController,
  GetUserByDocumentMicroserviceController,
  UserModel,
  CreateUserMicroserviceController,
  // UserCronServiceInit,
  UserOnboardingModel,
  UserSettingModel,
  PendingUserNestObserver,
  GetUserByEmailMicroserviceController,
  ChangeUserPasswordMicroserviceController,
  GetUserByIdMicroserviceController,
  GetUserHasPinMicroserviceController,
  UpdateUserPinMicroserviceController,
  AddUserPinMicroserviceController,
  UpdateUserPinHasCreatedMicroserviceController,
  UserActiveCronServiceInit,
  UserLegalRepresentorModel,
  AddressLegalRepresentorModel,
  OccupationModel,
  UserLegalAdditionalInfoModel,
} from '@zro/users/infrastructure';
import {
  CreateReportUserLegalRepresentorServiceKafka,
  CreateReportUserServiceKafka,
} from '@zro/reports/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature([
      CreateReportUserLegalRepresentorServiceKafka,
      CreateReportUserServiceKafka,
    ]),
    RedisModule,
    BcryptModule,
    DatabaseModule.forFeature([
      UserModel,
      UserLegalAdditionalInfoModel,
      UserOnboardingModel,
      UserSettingModel,
      UserLegalRepresentorModel,
      AddressLegalRepresentorModel,
      OccupationModel,
    ]),
  ],
  controllers: [
    GetUserByPhoneNumberMicroserviceController,
    GetUserByUuidMicroserviceController,
    GetUserByDocumentMicroserviceController,
    UpdateUserPropsMicroserviceController,
    CreateUserMicroserviceController,
    PendingUserNestObserver,
    GetUserByEmailMicroserviceController,
    ChangeUserPasswordMicroserviceController,
    GetUserByIdMicroserviceController,
    GetUserHasPinMicroserviceController,
    UpdateUserPinMicroserviceController,
    AddUserPinMicroserviceController,
    UpdateUserPinHasCreatedMicroserviceController,
  ],
  providers: [UserActiveCronServiceInit],
})
export class UserModule {}
