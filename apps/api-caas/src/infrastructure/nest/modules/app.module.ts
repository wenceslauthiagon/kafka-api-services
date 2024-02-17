import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BugReportModule, CacheModule, LoggerModule } from '@zro/common';
import { AuthModule } from './auth.module';
import { TradeModule } from './trade.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.api-caas.env'],
    }),
    LoggerModule,
    CacheModule.registerAsync(),
    BugReportModule,
    AuthModule,
    TradeModule,
  ],
})
export class AppModule {}
