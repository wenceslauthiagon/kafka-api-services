export const STORAGE_SERVICES = {
  STORAGE: {
    DOWNLOAD_FILE: (id: string) => `storage/files/${id}/download`,
    DELETE_FILE: (id: string) => `storage/files/${id}`,
    GET_FILE: 'storage/files',
    GET_FILE_BY_ID: (id: string) => `storage/files/${id}`,
    UPLOAD_FILE: 'storage/files/upload',
  },
};
