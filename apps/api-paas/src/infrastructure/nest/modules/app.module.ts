import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BugReportModule,
  CacheModule,
  JwtModule,
  KafkaModule,
  LoggerMiddleware,
  LoggerModule,
  RedisModule,
  RequestIdMiddleware,
  TranslateModule,
} from '@zro/common';
import { AuthModule } from './auth.module';
import { HealthModule } from './health.module';
import { BankingModule } from './banking.module';
import { OtcModule } from './otc.module';
import { OperationModule } from './operation.module';
import { PixPaymentModule } from './pix_payment.module';
import { QuotationModule } from './quotation.module';
import { PixKeyModule } from './pix_key.module';
import { ComplianceModule } from './compliance.module';
import { UtilsModule } from './utils.module';
import { NuPayModule } from './nupay.module';
import { PicPayModule } from './picpay.module';
import { CieloModule } from './cielo.module';

/**
 * API PaaS gateway module
 */
@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.api-paas.env'] }),
    CacheModule.registerAsync(),
    RedisModule,
    KafkaModule,
    JwtModule,
    TranslateModule,
    LoggerModule,
    BugReportModule,
    AuthModule,
    PixPaymentModule,
    OtcModule,
    QuotationModule,
    OperationModule,
    BankingModule,
    PixKeyModule,
    ComplianceModule,
    UtilsModule,
    HealthModule,
    NuPayModule,
    PicPayModule,
    CieloModule,
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
