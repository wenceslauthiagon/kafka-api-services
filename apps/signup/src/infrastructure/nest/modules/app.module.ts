import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BugReportModule, CacheModule, LoggerModule } from '@zro/common';
import { SignupModule } from './signup.module';
import { HealthModule } from './health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.signup.env'],
    }),
    CacheModule.registerAsync(),
    LoggerModule,
    BugReportModule,
    SignupModule,
    HealthModule,
  ],
  providers: [Logger],
})
export class AppModule {}
