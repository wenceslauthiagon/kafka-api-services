import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule, LoggerModule, ValidationModule } from '@zro/common';
import {
  DownloadFileRestController,
  DeleteFileRestController,
  GetAllFilesByFolderRestController,
  GetFileByIdRestController,
} from '@zro/api-admin/infrastructure';

/**
 * Storage endpoints module.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature(),
    LoggerModule,
    ValidationModule,
  ],
  controllers: [
    DownloadFileRestController,
    GetAllFilesByFolderRestController,
    GetFileByIdRestController,
    DeleteFileRestController,
  ],
  providers: [],
})
export class StorageModule {}
