import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BcryptModule,
  BugReportModule,
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  SendForgetPasswordMicroserviceController,
  ChangeAdminPasswordMicroserviceController,
  GetAdminByEmailMicroserviceController,
  AdminModel,
  GetAdminByIdMicroserviceController,
} from '@zro/admin/infrastructure';
import { SendEmailServiceKafka } from '@zro/notifications/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    BugReportModule,
    ValidationModule,
    KafkaModule.forFeature([SendEmailServiceKafka]),
    BcryptModule,
    DatabaseModule.forFeature([AdminModel]),
  ],
  controllers: [
    GetAdminByEmailMicroserviceController,
    GetAdminByIdMicroserviceController,
    SendForgetPasswordMicroserviceController,
    ChangeAdminPasswordMicroserviceController,
  ],
})
export class AdminModule {}
