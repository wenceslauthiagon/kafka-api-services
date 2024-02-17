import { QrCodeState } from '@zro/pix-zro-pay/domain';

export interface GetQrCodeByIdPixPaymentPspRequest {
  id: string;
}

export interface GetQrCodeByIdPixPaymentPspResponse {
  txId: string;
  emv: string;
  expirationDate: string;
  state: QrCodeState;
}

export interface GetQrCodeByIdPixPaymentPspGateway {
  getQrCodeById(
    request: GetQrCodeByIdPixPaymentPspRequest,
  ): Promise<GetQrCodeByIdPixPaymentPspResponse>;
}
