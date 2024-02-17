import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@zro/common';
import { StorageService } from '@zro/file-storage/infrastructure';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class FileStorageModule {}
