import validator from 'validator';

export const isUUID = (
  uuid: string,
  version: validator.UUIDVersion = 4,
): boolean => validator.isUUID(uuid, version);
