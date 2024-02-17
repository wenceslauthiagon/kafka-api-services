import {
  ConfirmPortabilityClaimPspRequest,
  ConfirmPortabilityClaimPspResponse,
  OfflinePixKeyPspException,
} from '@zro/pix-keys/application';

export const success = (
  pixKey: ConfirmPortabilityClaimPspRequest,
): Promise<ConfirmPortabilityClaimPspResponse> => {
  return Promise.resolve({ key: pixKey.key, keyType: pixKey.keyType });
};

export const offline = (): Promise<OfflinePixKeyPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixKeyPspException(error));
};
