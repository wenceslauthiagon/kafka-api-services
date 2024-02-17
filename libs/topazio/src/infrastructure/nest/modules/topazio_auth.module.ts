import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@zro/common';
import { TopazioAuthService } from '../providers/topazio_auth.service';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [TopazioAuthService],
  exports: [TopazioAuthService],
})
export class TopazioAuthModule {}
