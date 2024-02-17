import { v4 as uuidV4 } from 'uuid';
import { KeyType } from '@zro/pix-keys/domain';
import {
  CreatePixKeyPspRequest,
  CreatePixKeyPspResponse,
  OfflinePixKeyPspException,
  PixKeyOwnedBySamePersonPspException,
  PixKeyOwnedByThirdPersonPspException,
} from '@zro/pix-keys/application';

export const success = (
  pixKey: CreatePixKeyPspRequest,
): Promise<CreatePixKeyPspResponse> => {
  return Promise.resolve({
    key: pixKey.keyType === KeyType.EVP ? uuidV4() : pixKey.key,
    keyType: pixKey.keyType,
    endToEndId: uuidV4(),
  });
};

export const thirdParty = (): Promise<OfflinePixKeyPspException> => {
  const error = new Error('Third-Party');
  return Promise.reject(new PixKeyOwnedByThirdPersonPspException(error));
};

export const portability = (): Promise<OfflinePixKeyPspException> => {
  const error = new Error('Portability');
  return Promise.reject(new PixKeyOwnedBySamePersonPspException(error));
};

export const offline = (): Promise<OfflinePixKeyPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixKeyPspException(error));
};
