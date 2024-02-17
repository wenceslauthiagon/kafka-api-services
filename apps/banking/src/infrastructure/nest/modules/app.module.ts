import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BugReportModule,
  CacheModule,
  KafkaModule,
  LoggerModule,
  RedisModule,
} from '@zro/common';
import { HealthModule } from './health.module';
import { CityModule } from './city.module';
import { BankModule } from './bank.module';
import { BankingTedModule } from './banking_ted.module';
import { AdminBankingTedModule } from './admin_banking_ted.module';
import { AdminBankingAccountdModule } from './admin_banking_account.module';
import { BankingContactModule } from './banking_contact.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.banking.env'] }),
    CacheModule.registerAsync(),
    RedisModule,
    KafkaModule,
    LoggerModule,
    BugReportModule,
    CityModule,
    BankModule,
    BankingTedModule,
    AdminBankingTedModule,
    AdminBankingAccountdModule,
    BankingContactModule,
    HealthModule,
  ],
  providers: [Logger],
})
export class AppModule {}
