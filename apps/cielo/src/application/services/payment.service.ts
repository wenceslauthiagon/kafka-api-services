import {
  CieloCancelTransactionResponse,
  CieloCaptureTransactionResponse,
  CieloCreateAuthenticatedDebitTransactionRequest,
  CieloCreateAuthenticatedDebitTransactionResponse,
  CieloCreateCreditTransactionRequest,
  CieloCreateCreditTransactionResponse,
  CieloCreateNonAuthenticatedDebitTransactionRequest,
  CieloCreateNonAuthenticatedDebitTransactionResponse,
} from '@zro/cielo/infrastructure';

export interface ICieloService {
  createCreditTransaction(
    request: CieloCreateCreditTransactionRequest,
  ): Promise<CieloCreateCreditTransactionResponse>;

  createAuthenticatedDebitTransaction(
    request: CieloCreateAuthenticatedDebitTransactionRequest,
  ): Promise<CieloCreateAuthenticatedDebitTransactionResponse>;

  createNonAuthenticatedDebitTransaction(
    request: CieloCreateNonAuthenticatedDebitTransactionRequest,
  ): Promise<CieloCreateNonAuthenticatedDebitTransactionResponse>;

  getTransaction(oaymentId: string): Promise<CieloCaptureTransactionResponse>;

  cancelTransaction(
    checkoutId: string,
    amount: number,
  ): Promise<CieloCancelTransactionResponse>;
}
