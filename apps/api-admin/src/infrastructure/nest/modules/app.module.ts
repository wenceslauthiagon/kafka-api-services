import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BugReportModule,
  CacheModule,
  JwtModule,
  KafkaModule,
  LoggerMiddleware,
  LoggerModule,
  RequestIdMiddleware,
} from '@zro/common';
import { HealthModule } from './health.module';
import { AdminModule } from './admin.module';
import { AuthModule } from './auth.module';
import { OtcModule } from './otc.module';
import { PixKeyModule } from './pix_key.module';
import { BankingModule } from './banking.module';
import { PixPaymentModule } from './pix_payment.module';
import { StorageModule } from './storage.module';
import { OperationModule } from './operation.module';
import { ApiTopazioModule } from './api-topazio.module';
import { QuotationModule } from './quotation.module';
import { OtcBotModule } from './otc_bot.module';
import { UtilsModule } from './utils.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.api-admin.env'] }),
    CacheModule.registerAsync(),
    KafkaModule,
    JwtModule,
    LoggerModule,
    BugReportModule,
    AuthModule,
    AdminModule,
    BankingModule,
    OtcModule,
    OtcBotModule,
    PixKeyModule,
    PixPaymentModule,
    StorageModule,
    QuotationModule,
    OperationModule,
    ApiTopazioModule,
    HealthModule,
    UtilsModule,
    QuotationModule,
  ],
  providers: [Logger],
})
export class AppModule implements NestModule {
  /**
   * Add middlewares to nest app.
   * @param consumer Nest middleware manager.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
