import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZroBankAxiosService } from '@zro/zrobank/infrastructure/utils/zrobank_axios.util';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [ZroBankAxiosService],
  exports: [ZroBankAxiosService],
})
export class ZroBankUtilModule {}
