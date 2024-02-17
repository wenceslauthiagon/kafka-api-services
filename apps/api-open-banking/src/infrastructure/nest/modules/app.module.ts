import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BugReportModule,
  CacheModule,
  KafkaModule,
  LoggerMiddleware,
  LoggerModule,
  RequestIdMiddleware,
} from '@zro/common';
import { HealthModule } from './health.module';
import { PixPaymentModule } from './pix_payment.module';

/**
 * Api open banking module
 */
@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.api-open-banking.env'] }),
    CacheModule.registerAsync(),
    KafkaModule.forFeature(),
    LoggerModule,
    BugReportModule,
    PixPaymentModule,
    HealthModule,
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
