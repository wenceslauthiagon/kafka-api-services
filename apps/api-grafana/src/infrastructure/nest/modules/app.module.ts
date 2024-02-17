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
import { HealthModule } from './health.module';
import { AuthModule } from './auth.module';
import { UtilsModule } from './utils.module';

/**
 * API Grafana gateway module
 */
@Module({
  providers: [Logger],
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.api-grafana.env'] }),
    CacheModule.registerAsync(),
    KafkaModule,
    BcryptModule,
    ValidationModule,
    TranslateModule,
    LoggerModule,
    BugReportModule,
    AuthModule,
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
