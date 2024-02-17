export interface DownloadFileRequest {
  filePath: string;
}

export type DownloadFileResponse = Buffer;

export interface DownloadFileGateway {
  downloadFile(request: DownloadFileRequest): Promise<DownloadFileResponse>;
}
