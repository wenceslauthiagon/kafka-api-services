import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TopazioKycService } from '../providers/topazio_kyc.service';
import { TopazioAuthModule } from './topazio_auth.module';
import { TopazioUtilModule } from './topazio_util.module';

@Module({
  imports: [ConfigModule, LoggerModule, TopazioUtilModule, TopazioAuthModule],
  providers: [TopazioKycService],
  exports: [TopazioKycService],
})
export class TopazioKycModule {}
