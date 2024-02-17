import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@zro/common';
import { JdpiPixAuthService } from '../providers/jdpi_auth.service';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [JdpiPixAuthService],
  exports: [JdpiPixAuthService],
})
export class JdpiAuthModule {}
