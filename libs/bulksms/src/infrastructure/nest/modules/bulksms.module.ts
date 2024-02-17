import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { EncryptModule, LoggerModule } from '@zro/common';
import { BulksmsService } from '../../providers/bulksms.service';

@Module({
  imports: [ConfigModule, EncryptModule, LoggerModule],
  providers: [BulksmsService],
  exports: [BulksmsService],
})
export class BulksmsModule {}
