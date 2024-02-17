import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BugReportModule, CacheModule, LoggerModule } from '@zro/common';
import { OperationModule } from './operation.module';
import { HealthModule } from './health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
    CacheModule.registerAsync(),
    LoggerModule,
    BugReportModule,
    OperationModule,
    HealthModule,
  ],
  providers: [Logger],
})
export class AppModule {}
