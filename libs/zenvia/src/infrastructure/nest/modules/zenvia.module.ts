import { ConfigModule } from '@nestjs/config';
import { EncryptModule, LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ZenviaService } from '../../providers/zenvia.service';

@Module({
  imports: [ConfigModule, EncryptModule, LoggerModule],
  providers: [ZenviaService],
  exports: [ZenviaService],
})
export class ZenviaModule {}
