import { KeyType, ClaimReasonType } from '@zro/pix-keys/domain';

export interface DeniedClaimPspRequest {
  key: string;
  keyType: KeyType;
  document: string;
  reason: ClaimReasonType;
  ispb: string;
  claimId: string;
  isClaimOwner: boolean;
}

export interface DeniedClaimPspResponse {
  key: string;
  keyType: KeyType;
}

export interface DeniedClaimPspGateway {
  deniedClaim(data: DeniedClaimPspRequest): Promise<DeniedClaimPspResponse>;
}
