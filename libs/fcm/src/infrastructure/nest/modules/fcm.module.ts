import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@zro/common';
import { FcmService } from '@zro/fcm/infrastructure';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [FcmService],
  exports: [FcmService],
})
export class FcmModule {}
