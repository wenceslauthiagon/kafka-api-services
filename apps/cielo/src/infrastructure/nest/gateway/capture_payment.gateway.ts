import {
  CieloCredentialsCommon,
  CieloIniciatedTransactionIndicatorCommon,
  CieloLinkResponse,
  CieloTransactionStatusEnum,
  CieloVelocityAnalysisResponse,
} from '@zro/cielo/infrastructure';

export interface CieloCapturePaymentResponse {
  ServiceTaxAmount: number;
  Installments: number;
  Interest: string;
  Capture: boolean;
  Authenticate: boolean;
  Recurrent: boolean;
  DoSplit: boolean;
  IniciatedTransactionIndicator: CieloIniciatedTransactionIndicatorCommon;
  Credentials: CieloCredentialsCommon;
  ProofOfSale: string;
  AcquirerTransactionId: string;
  AuthorizationCode: string;
  SoftDescriptor: string;
  VelocityAnalysis: CieloVelocityAnalysisResponse;
  PaymentId: string;
  Type: string;
  Amount: number;
  ReceiveDate: Date;
  CapturedAmount: number;
  Currency: string;
  Country: string;
  Provider: string;
  ReasonCode: number;
  ReasonMessage: string;
  MerchantAdviceCode: string;
  Status: CieloTransactionStatusEnum;
  ProviderReturnCode: string;
  ProviderReturnMessage: string;
  Links: CieloLinkResponse[];
}
