import {
  CreateOwnershipClaimPspRequest,
  CreateOwnershipClaimPspResponse,
  OfflinePixKeyPspException,
} from '@zro/pix-keys/application';

export const success = (
  pixKey: CreateOwnershipClaimPspRequest,
): Promise<CreateOwnershipClaimPspResponse> => {
  return Promise.resolve({ key: pixKey.key, keyType: pixKey.keyType });
};

export const offline = (): Promise<OfflinePixKeyPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixKeyPspException(error));
};
