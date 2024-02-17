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

/**
 * API AsaaS gateway module
 */
@Module({
  providers: [Logger],
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.api-asaas.env'] }),
    CacheModule.registerAsync(),
    KafkaModule,
    BcryptModule,
    ValidationModule,
    TranslateModule,
    LoggerModule,
    BugReportModule,
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
