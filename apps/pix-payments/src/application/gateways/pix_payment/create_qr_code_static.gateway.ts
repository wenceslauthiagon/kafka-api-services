import { KeyType } from '@zro/pix-keys/domain';

export interface CreateQrCodeStaticPixPaymentPspRequest {
  key: string;
  keyType: KeyType;
  qrCodeStaticId: string;
  txId: string;
  recipientCity: string;
  recipientName: string;
  documentValue?: number;
  description?: string;
  ispbWithdrawal?: string;
}

export interface CreateQrCodeStaticPixPaymentPspResponse {
  emv: string;
}

export interface CreateQrCodeStaticPixPaymentPspGateway {
  createQrCodeStatic(
    request: CreateQrCodeStaticPixPaymentPspRequest,
  ): Promise<CreateQrCodeStaticPixPaymentPspResponse>;
}
