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
import { ApiJdpiModule } from './jdpi.module';
import { HealthModule } from './health.module';

/**
 * API Jdpi gateway module
 */
@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.api-jdpi.env'] }),
    CacheModule.registerAsync(),
    KafkaModule,
    RedisModule,
    JwtModule,
    LoggerModule,
    BugReportModule,
    TranslateModule,
    AuthModule,
    ApiJdpiModule,
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
