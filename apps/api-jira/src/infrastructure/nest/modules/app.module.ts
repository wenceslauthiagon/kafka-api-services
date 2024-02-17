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
import { AuthModule } from './auth.module';
import { HealthModule } from './health.module';
import { ApiJiraModule } from './jira.module';

/**
 * API Jira gateway module
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.api-jira.env'],
    }),
    CacheModule.registerAsync(),
    KafkaModule,
    LoggerModule,
    BugReportModule,
    AuthModule,
    ApiJiraModule,
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
