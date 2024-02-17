import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@zro/common';
import { S3StorageService } from '@zro/s3-storage/infrastructure';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [S3StorageService],
  exports: [S3StorageService],
})
export class S3StorageModule {}
