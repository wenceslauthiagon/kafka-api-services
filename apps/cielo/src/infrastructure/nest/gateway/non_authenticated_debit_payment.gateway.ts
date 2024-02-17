import {
  CieloCredentialsCommon,
  CieloDebitCardCommon,
  CieloIniciatedTransactionIndicatorCommon,
} from '@zro/cielo/infrastructure';

import { CieloTransactionStatusEnum } from '@zro/cielo/infrastructure';

export interface CieloCreateNonAuthenticatedDebitPaymentRequest {
  Provider: string;
  Type: string;
  Amount: number;
  Currency: string;
  Country: string;
  Installments: number;
  Interest: string;
  Capture: boolean;
  Authenticate: boolean;
  Recurrent: boolean;
  SoftDescriptor: string;
  DoSplit: boolean;
  DebitCard: CieloDebitCardCommon;
  IniciatedTransactionIndicator: CieloIniciatedTransactionIndicatorCommon;
  Credentials: CieloCredentialsCommon;
}

export interface CieloCreateNonAuthenticatedDebitPaymentResponse {
  AcquirerTransactionId: string;
  PaymentId: string;
  Type: string;
  Amount: number;
  ReceivedDate: Date;
  Currency: string;
  Country: string;
  Provider: string;
  AuthorizationCode: string;
  ReasonCode: number;
  ReasonMessage: string;
  MerchantAdviceCode: string;
  Status: CieloTransactionStatusEnum;
  ProviderReturnCode: string;
  ProviderReturnMessage: string;
}
