import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule, CacheModule } from '@zro/common';
import {
  B2C2AxiosService,
  B2C2CryptoRemittanceService,
} from '@zro/b2c2/infrastructure';

@Module({
  imports: [ConfigModule, LoggerModule, CacheModule.registerAsync()],
  providers: [B2C2AxiosService, B2C2CryptoRemittanceService],
  exports: [B2C2CryptoRemittanceService],
})
export class B2C2CryptoRemittanceModule {}
