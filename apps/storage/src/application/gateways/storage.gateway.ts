import {
  StorageFileGateway,
  DownloadFileGateway,
  DeleteFileGateway,
} from '@zro/storage/application';

export type StorageGateway = StorageFileGateway &
  DownloadFileGateway &
  DeleteFileGateway & {
    getProviderName(): string;
  };
