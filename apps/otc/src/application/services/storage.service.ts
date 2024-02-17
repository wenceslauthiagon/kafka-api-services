import { AxiosInstance } from 'axios';
import { File } from '@zro/storage/domain';

export interface StorageService {
  /**
   * Upload File.
   * @param file File sheet.
   * @returns File if found or null otherwise.
   */
  uploadFile(
    id: string,
    file: Buffer,
    folderName: string,
    fileName: string,
    instanceAxios: AxiosInstance,
  ): Promise<File>;
}
