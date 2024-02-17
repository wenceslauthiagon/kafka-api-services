import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  UserApiKeyModel,
  GetUserApiKeyByIdMicroserviceController,
  GetUserApiKeyByUserMicroserviceController,
} from '@zro/users/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([UserApiKeyModel]),
  ],
  controllers: [
    GetUserApiKeyByIdMicroserviceController,
    GetUserApiKeyByUserMicroserviceController,
  ],
})
export class UserApiKeyModule {}
