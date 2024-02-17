export const isValidFormatFile = (
  mimetype: string,
  format: Array<string>,
): boolean => {
  return format.includes(mimetype);
};
