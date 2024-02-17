import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  JwtModule,
  KafkaModule,
  LoggerMiddleware,
  LoggerModule,
  RequestIdMiddleware,
  TranslateModule,
  CacheModule,
  BugReportModule,
  RecaptchaModule,
  BcryptModule,
  ValidationModule,
  RedisModule,
} from '@zro/common';
import { HealthModule } from './health.module';
import { PinGuard } from '../auth/pin.guard';
import { AuthModule } from './auth.module';
import { PixKeyModule } from './pix_key.module';
import { PixPaymentModule } from './pix_payment.module';
import { ComplianceModule } from './compliance.module';
import { BankingModule } from './banking.module';
import { OperationModule } from './operation.module';
import { SignupModule } from './signup.module';
import { QuotationModule } from './quotation.module';
import { OtcModule } from './otc.module';
import { PaymentsGatewayModule } from './payments_gateway.module';
import { UserModule } from './user.module';
import { UtilsModule } from './utils.module';

/**
 * API Users gateway module
 */
@Module({
  providers: [Logger, PinGuard],
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.api-users.env'] }),
    CacheModule.registerAsync(),
    RedisModule,
    KafkaModule,
    JwtModule,
    BcryptModule,
    ValidationModule,
    TranslateModule,
    LoggerModule,
    BugReportModule,
    RecaptchaModule,
    AuthModule,
    SignupModule,
    ComplianceModule,
    PixKeyModule,
    PixPaymentModule,
    BankingModule,
    OperationModule,
    QuotationModule,
    OtcModule,
    PaymentsGatewayModule,
    UserModule,
    UtilsModule,
    HealthModule,
  ],
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
