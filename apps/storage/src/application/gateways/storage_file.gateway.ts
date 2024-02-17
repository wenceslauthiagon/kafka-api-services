export type StorageFileRequest = {
  oldPath: string;
  newPath: string;
};

export interface StorageFileResponse {
  success: boolean;
}

export interface StorageFileGateway {
  storageFile(request: StorageFileRequest): Promise<StorageFileResponse>;
}
