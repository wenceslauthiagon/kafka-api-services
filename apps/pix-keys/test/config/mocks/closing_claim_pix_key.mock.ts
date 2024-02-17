import {
  ClosingClaimPspRequest,
  ClosingClaimPspResponse,
  OfflinePixKeyPspException,
} from '@zro/pix-keys/application';
import { ClaimReasonType } from '@zro/pix-keys/domain';

export const success = (
  pixKey: ClosingClaimPspRequest,
): Promise<ClosingClaimPspResponse> => {
  return Promise.resolve({
    key: pixKey.key,
    keyType: pixKey.keyType,
    document: pixKey.document,
    reason: ClaimReasonType.USER_REQUESTED,
  });
};

export const offline = (): Promise<OfflinePixKeyPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixKeyPspException(error));
};
