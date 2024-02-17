import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GenialAxiosService } from '@zro/genial/infrastructure/utils/genial_axios.util';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [GenialAxiosService],
  exports: [GenialAxiosService],
})
export class GenialUtilModule {}
