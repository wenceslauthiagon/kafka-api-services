import { LoggerModule } from '@zro/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AsaasAxiosService } from '@zro/asaas/infrastructure/utils/asaas_axios.util';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [AsaasAxiosService],
  exports: [AsaasAxiosService],
})
export class AsaasUtilModule {}
