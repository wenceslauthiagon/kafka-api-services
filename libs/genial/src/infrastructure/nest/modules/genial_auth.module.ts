import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@zro/common';
import { GenialPixAuthService } from '../providers/genial_auth.service';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [GenialPixAuthService],
  exports: [GenialPixAuthService],
})
export class GenialAuthModule {}
