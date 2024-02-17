import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@zro/common';
import { ZroBankPixAuthService } from '../providers/zrobank_auth.service';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [ZroBankPixAuthService],
  exports: [ZroBankPixAuthService],
})
export class ZroBankAuthModule {}
