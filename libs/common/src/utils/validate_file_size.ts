export const isValidFileSize = (fileSize: number): boolean => {
  return fileSize < 5 * 1024 * 1024;
};
