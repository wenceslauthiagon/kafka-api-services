import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BcryptModule,
  BugReportModule,
  CacheModule,
  LoggerModule,
} from '@zro/common';
import { HealthModule } from './health.module';
import { AdminModule } from './admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.admin.env'],
    }),
    CacheModule.registerAsync(),
    LoggerModule,
    BugReportModule,
    BcryptModule,
    AdminModule,
    HealthModule,
  ],
  providers: [Logger],
})
export class AppModule {}
