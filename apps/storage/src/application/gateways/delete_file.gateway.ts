export interface DeleteFileRequest {
  filePath: string;
}

export type DeleteFileResponse = void;

export interface DeleteFileGateway {
  deleteFile(request: DeleteFileRequest): Promise<DeleteFileResponse>;
}
