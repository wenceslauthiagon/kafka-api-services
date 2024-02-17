import { EncryptModule, LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  DockAuthService,
  DockAxiosService,
  DockService,
} from '@zro/dock/infrastructure';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ScheduleModule.forRoot(),
    EncryptModule,
  ],
  providers: [DockAuthService, DockAxiosService, DockService],
  exports: [DockService],
})
export class DockModule {}
