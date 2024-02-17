import {
  DecodedPixKeyPspResponse,
  OfflinePixKeyPspException,
} from '@zro/pix-keys/application';
import { DecodedPixKey } from '@zro/pix-keys/domain';

export const success = (
  decodedPixKey: DecodedPixKey,
): Promise<DecodedPixKeyPspResponse> => {
  return Promise.resolve({
    dictAccountId: decodedPixKey.dictAccountId,
    cidId: decodedPixKey.cidId,
    requestId: null,
    type: decodedPixKey.type,
    accountType: decodedPixKey.accountType,
    personType: decodedPixKey.personType,
    key: decodedPixKey.key,
    branch: decodedPixKey.branch,
    accountNumber: decodedPixKey.accountNumber,
    ispb: decodedPixKey.ispb,
    document: decodedPixKey.document,
    name: decodedPixKey.name,
    tradeName: decodedPixKey.tradeName,
    activeAccount: decodedPixKey.activeAccount,
    accountOpeningDate: decodedPixKey.accountOpeningDate,
    keyCreationDate: decodedPixKey.keyCreationDate,
    keyOwnershipDate: decodedPixKey.keyOwnershipDate,
    claimRequestDate: decodedPixKey.claimRequestDate,
    endToEndId: decodedPixKey.endToEndId,
  });
};

export const offline = (): Promise<OfflinePixKeyPspException> => {
  const error = new Error('Mock PSP Offline');
  return Promise.reject(new OfflinePixKeyPspException(error));
};
