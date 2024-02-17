import {
  CieloDebitCardCommon,
  CieloExternalAuthenticationCommon,
  CieloIniciatedTransactionIndicatorCommon,
  CieloTransactionStatusEnum,
} from '@zro/cielo/infrastructure';

export interface CieloCreateAuthenticatedDebitPaymentRequest {
  Provider: string;
  Type: string;
  Authenticate: boolean;
  Amount: number;
  Recurrent: boolean;
  ReturnUrl: string;
  AcquirerTransactionId: string;
  Installments: number;
  AuthorizationCode: string;
  DebitCard: CieloDebitCardCommon;
  ExternalAuthentication: CieloExternalAuthenticationCommon;
  IniciatedTransactionIndicator: CieloIniciatedTransactionIndicatorCommon;
}

export interface CieloCreateAuthenticatedDebitPaymentResponse {
  Status: CieloTransactionStatusEnum;
  Authenticate: boolean;
  Recurrent: boolean;
  ReturnUrl: string;
  PaymentId: string;
  ProofOfSale: string;
  AcquirerTransactionId: string;
  AuthorizationCode: string;
  ExternalAuthentication: CieloExternalAuthenticationCommon;
  IniciatedTransactionIndicator: CieloIniciatedTransactionIndicatorCommon;
}
