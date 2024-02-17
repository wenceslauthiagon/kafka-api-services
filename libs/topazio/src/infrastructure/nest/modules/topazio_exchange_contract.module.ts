import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TopazioAuthModule } from './topazio_auth.module';
import { TopazioUtilModule } from './topazio_util.module';
import { TopazioExchangeContractService } from '../providers/topazio_exchange_contract.service';

@Module({
  imports: [ConfigModule, LoggerModule, TopazioUtilModule, TopazioAuthModule],
  providers: [TopazioExchangeContractService],
  exports: [TopazioExchangeContractService],
})
export class TopazioExchangeContractModule {}
