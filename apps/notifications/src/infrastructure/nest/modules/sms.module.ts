import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  EncryptModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import { ZenviaModule } from '@zro/zenvia';
import { BulksmsModule } from '@zro/bulksms';
import { DockModule } from '@zro/dock';
import {
  SmsKafkaEmitterInit,
  SmsModel,
  CreateSmsMicroserviceController,
  CreatedSmsNestObserver,
  SmsTemplateModel,
} from '@zro/notifications/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([SmsModel, SmsTemplateModel]),
    EncryptModule,
    ZenviaModule,
    BulksmsModule,
    DockModule,
  ],
  providers: [SmsKafkaEmitterInit],
  controllers: [CreateSmsMicroserviceController, CreatedSmsNestObserver],
})
export class SmsModule {}
