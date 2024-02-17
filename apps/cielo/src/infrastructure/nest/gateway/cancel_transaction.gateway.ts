import {
  CieloLinkResponse,
  CieloTransactionStatusEnum,
} from '@zro/cielo/infrastructure';

export interface CieloCancelTransactionResponse {
  Status: CieloTransactionStatusEnum;
  ReasonCode: number;
  ReasonMessage: string;
  ProviderReturnCode: string;
  ProviderReturnMessage: string;
  Links: CieloLinkResponse[];
}
