import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TopazioAxiosService } from '@zro/topazio/infrastructure/utils/topazio_axios.util';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [TopazioAxiosService],
  exports: [TopazioAxiosService],
})
export class TopazioUtilModule {}
