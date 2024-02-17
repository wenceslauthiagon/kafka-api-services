import { ClaimStatusType, ClaimType, KeyType } from '@zro/pix-keys/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { PersonType } from '@zro/users/domain';

export interface GetClaimPixKeyPspRequest {
  key?: string;
  ispb: string;
  personType?: PersonType;
  document?: string;
  branch?: string;
  accountType?: AccountType;
  accountNumber?: string;
  claimType?: ClaimType;
  limit?: number;
  status?: ClaimStatusType;
  lastChangeDateStart?: Date;
  lastChangeDateEnd?: Date;
}

export interface GetClaimPixKeyPspResponse {
  hasMoreElements: boolean;
  claims: GetClaimPixKeyPspResponseItem[];
}

export interface GetClaimPixKeyPspResponseItem {
  id: string;
  type: ClaimType;
  key: string;
  keyType: KeyType;
  ispb: string;
  branch?: string;
  accountNumber?: string;
  personType?: PersonType;
  document?: string;
  finalResolutionDate?: Date;
  finalCompleteDate?: Date;
  lastChangeDate?: Date;
  status: ClaimStatusType;
}

export interface GetClaimPixKeyPspGateway {
  getClaimPixKey(
    data: GetClaimPixKeyPspRequest,
  ): Promise<GetClaimPixKeyPspResponse>;
}
