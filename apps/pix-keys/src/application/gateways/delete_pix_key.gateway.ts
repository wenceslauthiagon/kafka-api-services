import { KeyType, PixKeyReasonType } from '@zro/pix-keys/domain';

export interface DeletePixKeyPspRequest {
  key: string;
  keyType: KeyType;
  reason: PixKeyReasonType;
  ispb: string;
  pixKeyId: string;
}

export interface DeletePixKeyPspResponse {
  key: string;
  keyType: KeyType;
}

export interface DeletePixKeyPspGateway {
  deletePixKey(data: DeletePixKeyPspRequest): Promise<DeletePixKeyPspResponse>;
}
