import { KeyType, ClaimReasonType } from '@zro/pix-keys/domain';

export interface ClosingClaimPspRequest {
  key: string;
  keyType: KeyType;
  document: string;
  reason: ClaimReasonType;
  claimId: string;
  ispb: string;
}

export interface ClosingClaimPspResponse {
  key: string;
  keyType: KeyType;
}

export interface ClosingClaimPspGateway {
  closingClaim(data: ClosingClaimPspRequest): Promise<ClosingClaimPspResponse>;
}
