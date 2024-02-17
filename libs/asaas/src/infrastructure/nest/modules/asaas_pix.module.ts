import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentGatewayServiceModule } from '@zro/pix-zro-pay/infrastructure';
import { AsaasPixService } from '../providers/asaas_pix.service';
import { AsaasUtilModule } from './asaas_util.module';

@Module({
  imports: [ConfigModule, LoggerModule, AsaasUtilModule],
  providers: [AsaasPixService],
  exports: [AsaasPixService],
})
@PaymentGatewayServiceModule()
export class AsaasPixModule {}
