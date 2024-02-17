import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BugReportModule,
  CacheModule,
  KafkaModule,
  LoggerModule,
  RedisModule,
} from '@zro/common';
import { TransactionModule } from './transaction.module';
import { CompanyModule } from './company.module';
import { QrCodeModule } from './qr_code.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.pix-zro-pay.env'] }),
    CacheModule.registerAsync(),
    RedisModule,
    KafkaModule,
    LoggerModule,
    BugReportModule,
    TransactionModule,
    CompanyModule,
    QrCodeModule,
  ],
  providers: [Logger],
})
export class AppModule {}
