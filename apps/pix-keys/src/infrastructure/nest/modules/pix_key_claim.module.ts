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
import { JdpiPixModule } from '@zro/jdpi';
import {
  PixKeyModel,
  PixKeyClaimModel,
  SyncGetAllPixKeyClaimCronService,
  ReceiveReadyPixKeyClaimNestObserver,
  PixKeyClaimEventKafkaEmitterInit,
} from '@zro/pix-keys/infrastructure';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    LoggerModule,
    ValidationModule,
    KafkaModule.forFeature(),
    DatabaseModule.forFeature([PixKeyModel, PixKeyClaimModel]),
    JdpiPixModule,
    TranslateModule,
  ],
  controllers: [ReceiveReadyPixKeyClaimNestObserver],
  providers: [
    PixKeyClaimEventKafkaEmitterInit,
    SyncGetAllPixKeyClaimCronService,
  ],
})
export class PixKeyClaimModule {}
