import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { S3StorageModule } from '@zro/s3-storage/infrastructure';
import {
  DatabaseModule,
  KafkaModule,
  LoggerModule,
  ValidationModule,
} from '@zro/common';
import {
  FileModel,
  UploadFileRestController,
  DownloadFileRestController,
  GetAllFilesByFolderRestController,
  GetFileByIdRestController,
  DeleteFileRestController,
} from '@zro/storage/infrastructure';

interface MultDestConfig {
  APP_MULTER_DEST: string;
}

/**
 * Storage endpoints module.
 */
@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<MultDestConfig>) => ({
        dest: configService.get('APP_MULTER_DEST'),
        limits: {
          fileSize: 100 * 1024 * 1024, // 100Mb
        },
      }),
    }),
    ConfigModule,
    KafkaModule.forFeature(),
    LoggerModule,
    ValidationModule,
    DatabaseModule.forFeature([FileModel]),
    S3StorageModule,
  ],
  controllers: [
    UploadFileRestController,
    DownloadFileRestController,
    GetAllFilesByFolderRestController,
    GetFileByIdRestController,
    DeleteFileRestController,
  ],
  providers: [],
})
export class StorageModule {}
