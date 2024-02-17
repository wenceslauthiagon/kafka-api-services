import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  GetUserPinAttemptByUserMicroserviceController,
  UpdateUserPinAttemptMicroserviceController,
  UserModel,
  UserPinAttemptsModel,
} from '@zro/users/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([UserModel, UserPinAttemptsModel]),
  ],
  controllers: [
    GetUserPinAttemptByUserMicroserviceController,
    UpdateUserPinAttemptMicroserviceController,
  ],
})
export class UserPinAttemptModule {}
