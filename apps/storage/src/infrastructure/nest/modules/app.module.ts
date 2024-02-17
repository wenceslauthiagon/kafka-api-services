import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BugReportModule,
  CacheModule,
  LoggerMiddleware,
  LoggerModule,
  RequestIdMiddleware,
} from '@zro/common';
import { StorageModule } from './storage.module';
import { HealthModule } from './health.module';

/**
 * API Storage gateway module
 */
@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.storage.env'] }),
    CacheModule.registerAsync(),
    LoggerModule,
    BugReportModule,
    StorageModule,
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
