import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TopazioBankingService } from '../providers/topazio_banking.service';
import { TopazioAuthModule } from './topazio_auth.module';
import { TopazioUtilModule } from './topazio_util.module';

@Module({
  imports: [ConfigModule, LoggerModule, TopazioUtilModule, TopazioAuthModule],
  providers: [TopazioBankingService],
  exports: [TopazioBankingService],
})
export class TopazioBankingModule {}
