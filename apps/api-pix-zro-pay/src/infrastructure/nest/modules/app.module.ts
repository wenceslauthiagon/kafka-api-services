import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  KafkaModule,
  LoggerMiddleware,
  LoggerModule,
  RequestIdMiddleware,
  TranslateModule,
  CacheModule,
  BugReportModule,
  BcryptModule,
  ValidationModule,
} from '@zro/common';
import { AuthModule } from './auth.module';
import { PixZroPayModule } from './pix_zro_pay.module';

/**
 * API Pix Zro Pay gateway module
 */
@Module({
  providers: [Logger],
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.api-pix-zro-pay.env'] }),
    CacheModule.registerAsync(),
    KafkaModule,
    BcryptModule,
    ValidationModule,
    TranslateModule,
    LoggerModule,
    BugReportModule,
    AuthModule,
    PixZroPayModule,
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
