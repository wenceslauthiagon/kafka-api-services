import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MatracaModule } from '@zro/matraca';
import {
  DatabaseModule,
  EncryptModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  EmailKafkaEmitterInit,
  EmailModel,
  CreateEmailMicroserviceController,
  EmailNestObserver,
  EmailTemplateModel,
} from '@zro/notifications/infrastructure';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([EmailModel, EmailTemplateModel]),
    EncryptModule,
    MatracaModule,
  ],
  providers: [EmailKafkaEmitterInit],
  controllers: [CreateEmailMicroserviceController, EmailNestObserver],
})
export class EmailModule {}
