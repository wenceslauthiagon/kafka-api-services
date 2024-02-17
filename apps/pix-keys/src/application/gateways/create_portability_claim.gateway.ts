import { KeyType, PixKeyClaim } from '@zro/pix-keys/domain';
import { PersonType } from '@zro/users/domain';

export interface CreatePortabilityClaimPspRequest {
  keyType: KeyType;
  key: string;
  personType: PersonType;
  document: string;
  name: string;
  tradeName?: string;
  branch: string;
  accountNumber: string;
  accountOpeningDate: Date;
  ispb: string;
  pixKeyId: string;
}

export interface CreatePortabilityClaimPspResponse {
  keyType: KeyType;
  key: string;
  claim?: PixKeyClaim;
  // FIXME: check JD response fields
}

export interface CreatePortabilityClaimPspGateway {
  createPortabilityClaim(
    data: CreatePortabilityClaimPspRequest,
  ): Promise<CreatePortabilityClaimPspResponse>;
}
