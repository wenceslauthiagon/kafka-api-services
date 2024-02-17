import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentGatewayServiceModule } from '@zro/pix-zro-pay/infrastructure';
import { GenialPixService } from '../providers/genial_pix.service';
import { GenialUtilModule } from './genial_util.module';
import { GenialAuthModule } from './genial_auth.module';

@Module({
  imports: [ConfigModule, LoggerModule, GenialUtilModule, GenialAuthModule],
  providers: [GenialPixService],
  exports: [GenialPixService],
})
@PaymentGatewayServiceModule()
export class GenialPixModule {}
