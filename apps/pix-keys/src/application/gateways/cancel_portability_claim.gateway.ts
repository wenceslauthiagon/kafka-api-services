import { KeyType, ClaimReasonType } from '@zro/pix-keys/domain';

export interface CancelPortabilityClaimPspRequest {
  key: string;
  keyType: KeyType;
  document: string;
  reason: ClaimReasonType;
  ispb: string;
  claimId: string;
  isClaimOwner: boolean;
}

export interface CancelPortabilityClaimPspResponse {
  key: string;
  keyType: KeyType;
}

export interface CancelPortabilityClaimPspGateway {
  cancelPortabilityClaim(
    data: CancelPortabilityClaimPspRequest,
  ): Promise<CancelPortabilityClaimPspResponse>;
}
