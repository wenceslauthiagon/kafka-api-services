import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BugReportModule,
  CacheModule,
  KafkaModule,
  LoggerModule,
} from '@zro/common';
import { HealthModule } from './health.module';
import { PaymentsGatewayModule } from './payments_gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.payments-gateway.env'] }),
    CacheModule.registerAsync(),
    KafkaModule,
    LoggerModule,
    BugReportModule,
    PaymentsGatewayModule,
    HealthModule,
  ],
  providers: [Logger],
})
export class AppModule {}
