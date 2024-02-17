import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JdpiBankService } from '../providers/jdpi_bank.service';
import { JdpiAuthModule } from './jdpi_auth.module';
import { JdpiUtilModule } from './jdpi_util.module';

@Module({
  imports: [ConfigModule, LoggerModule, JdpiUtilModule, JdpiAuthModule],
  providers: [JdpiBankService],
  exports: [JdpiBankService],
})
export class JdpiBankModule {}
