import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentGatewayServiceModule } from '@zro/pix-zro-pay/infrastructure';
import { ZroBankPixService } from '../providers/zrobank_pix.service';
import { ZroBankUtilModule } from './zrobank_util.module';
import { ZroBankAuthModule } from './zrobank_auth.module';

@Module({
  imports: [ConfigModule, LoggerModule, ZroBankUtilModule, ZroBankAuthModule],
  providers: [ZroBankPixService],
  exports: [ZroBankPixService],
})
@PaymentGatewayServiceModule()
export class ZroBankPixModule {}
