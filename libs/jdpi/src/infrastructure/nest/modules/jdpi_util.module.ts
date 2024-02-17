import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JdpiAxiosService } from '@zro/jdpi/infrastructure/utils/jdpi_axios.util';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [JdpiAxiosService],
  exports: [JdpiAxiosService],
})
export class JdpiUtilModule {}
