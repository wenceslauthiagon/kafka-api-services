import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  GetOnboardingByUserAndStatusIsFinishedMicroserviceController,
  GetOnboardingByDocumentAndStatusIsFinishedMicroserviceController,
  OnboardingModel,
  UserModel,
  AddressModel,
  GetAddressByIdMicroserviceController,
  GetOnboardingByAccountNumberAndStatusIsFinishedMicroserviceController,
} from '@zro/users/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([OnboardingModel, AddressModel, UserModel]),
  ],
  controllers: [
    GetOnboardingByUserAndStatusIsFinishedMicroserviceController,
    GetOnboardingByDocumentAndStatusIsFinishedMicroserviceController,
    GetOnboardingByAccountNumberAndStatusIsFinishedMicroserviceController,
    GetAddressByIdMicroserviceController,
  ],
})
export class OnboardingModule {}
