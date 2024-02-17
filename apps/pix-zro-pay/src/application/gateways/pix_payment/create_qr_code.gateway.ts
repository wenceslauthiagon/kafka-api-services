import { BankAccount, Company, QrCodeFormat } from '@zro/pix-zro-pay/domain';

export interface CreateQrCodePixPaymentPspRequest {
  value?: number;
  expirationSeconds: number;
  description?: string;
  payerName?: string;
  payerDocument?: number;
  company?: Company;
  bankAccount?: BankAccount;
  format?: QrCodeFormat;
  allowsMultiplePayments?: boolean;
  daysAfterVenc?: number;
  finePercentual?: number;
  modalityChange?: number;
}

export interface CreateQrCodePixPaymentPspResponse {
  id?: string;
  txId: string;
  emv: string;
  expirationDate: string;
}

export interface CreateQrCodePixPaymentPspGateway {
  createQrCode(
    request: CreateQrCodePixPaymentPspRequest,
  ): Promise<CreateQrCodePixPaymentPspResponse>;
}
