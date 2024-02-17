import { KeyType, ClaimReasonType } from '@zro/pix-keys/domain';

export interface ConfirmPortabilityClaimPspRequest {
  key: string;
  keyType: KeyType;
  document: string;
  reason: ClaimReasonType;
  claimId: string;
  ispb: string;
}

export interface ConfirmPortabilityClaimPspResponse {
  key: string;
  keyType: KeyType;
}

export interface ConfirmPortabilityClaimPspGateway {
  confirmPortabilityClaim(
    data: ConfirmPortabilityClaimPspRequest,
  ): Promise<ConfirmPortabilityClaimPspResponse>;
}
