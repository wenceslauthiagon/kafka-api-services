import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BugReportModule,
  CacheModule,
  KafkaModule,
  LoggerModule,
  TranslateModule,
} from '@zro/common';
import { DecodedPixKeyModule } from './decoded_pix_key.module';
import { PixKeyClaimModule } from './pix_key_claim.module';
import { PixKeyModule } from './pix_key.module';
import { HealthModule } from './health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.pix-keys.env'] }),
    CacheModule.registerAsync(),
    KafkaModule,
    LoggerModule,
    BugReportModule,
    TranslateModule,
    PixKeyModule,
    DecodedPixKeyModule,
    HealthModule,
    PixKeyClaimModule,
  ],
  providers: [Logger],
})
export class AppModule {}
