import { KeyType } from '@zro/pix-keys/domain';
import { PersonType } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';

export interface DecodedPixKeyPspRequest {
  key: string;
  ispb: string;
  userDocument: string;
  endToEndId?: string;
  keyType?: KeyType;
}

export interface DecodedPixKeyPspResponse {
  dictAccountId?: number;
  cidId?: string;
  requestId?: string;
  type: KeyType;
  accountType: AccountType;
  personType: PersonType;
  key: string;
  branch: string;
  accountNumber: string;
  ispb: string;
  document: string;
  name: string;
  tradeName?: string;
  activeAccount: boolean;
  accountOpeningDate: Date;
  keyCreationDate: Date;
  keyOwnershipDate: Date;
  claimRequestDate: Date;
  endToEndId: string;
}

export interface DecodedPixKeyPspGateway {
  /**
   * Decoded a Pix key on banking partner.
   * @param data Decoded pix key request
   * @returns Decoded pix key.
   * @throws {PixKeyNotFoundExceptionPspException} If requested key was not found.
   */
  decodePixKey(
    data: DecodedPixKeyPspRequest,
  ): Promise<DecodedPixKeyPspResponse>;
}
