import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BugReportModule,
  CacheModule,
  KafkaModule,
  LoggerMiddleware,
  LoggerModule,
  RequestIdMiddleware,
  TranslateModule,
} from '@zro/common';
import { AuthModule } from './auth.module';
import { HealthModule } from './health.module';
import { ApiTopazioModule } from './topazio.module';

/**
 * API Topazio gateway module
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.api-topazio.env'],
    }),
    CacheModule.registerAsync(),
    KafkaModule,
    LoggerModule,
    BugReportModule,
    TranslateModule,
    AuthModule,
    ApiTopazioModule,
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
