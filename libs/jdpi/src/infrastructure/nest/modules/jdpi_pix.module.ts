import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JdpiPixService } from '../providers/jdpi_pix.service';
import { JdpiAuthModule } from './jdpi_auth.module';
import { JdpiUtilModule } from './jdpi_util.module';

@Module({
  imports: [ConfigModule, LoggerModule, JdpiUtilModule, JdpiAuthModule],
  providers: [JdpiPixService],
  exports: [JdpiPixService],
})
export class JdpiPixModule {}
