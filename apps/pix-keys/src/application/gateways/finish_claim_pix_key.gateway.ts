import { KeyType } from '@zro/pix-keys/domain';

export interface FinishClaimPixKeyPspRequest {
  key: string;
  keyType: KeyType;
  claimId: string;
  ispb: string;
}

export interface FinishClaimPixKeyPspResponse {
  key: string;
  keyType: KeyType;
}

export interface FinishClaimPixKeyPspGateway {
  finishClaimPixKey(
    data: FinishClaimPixKeyPspRequest,
  ): Promise<FinishClaimPixKeyPspResponse>;
}
