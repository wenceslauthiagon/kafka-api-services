import { ConfigModule } from '@nestjs/config';
import { EncryptModule, LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { MatracaService } from '../../providers/matraca.service';

@Module({
  imports: [ConfigModule, EncryptModule, LoggerModule],
  providers: [MatracaService],
  exports: [MatracaService],
})
export class MatracaModule {}
