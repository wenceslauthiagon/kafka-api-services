import { KeyType, PixKeyReasonType } from '@zro/pix-keys/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { PersonType } from '@zro/users/domain';

export interface CreatePixKeyPspRequest {
  key?: string;
  keyType: KeyType;
  personType: PersonType;
  document: string;
  name: string;
  branch: string;
  accountNumber: string;
  accountOpeningDate: Date;
  tradeName?: string;
  reason: PixKeyReasonType;
  accountType: AccountType;
  ispb: string;
  pixKeyId: string;
}

export interface CreatePixKeyPspResponse {
  key: string;
  keyType: KeyType;
}

export interface CreatePixKeyPspGateway {
  createPixKey(data: CreatePixKeyPspRequest): Promise<CreatePixKeyPspResponse>;
}
