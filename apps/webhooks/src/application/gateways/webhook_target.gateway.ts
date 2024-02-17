import {
  Payment,
  PixDeposit,
  PixDevolution,
  PixDevolutionReceived,
} from '@zro/pix-payments/domain';

export type WebhookTargetGatewayPaymentRequest = Pick<
  Payment,
  | 'id'
  | 'endToEndId'
  | 'txId'
  | 'value'
  | 'ownerFullName'
  | 'ownerPersonType'
  | 'ownerDocument'
  | 'ownerAccountNumber'
  | 'ownerBranch'
  | 'beneficiaryName'
  | 'beneficiaryPersonType'
  | 'beneficiaryDocument'
  | 'beneficiaryBankName'
  | 'beneficiaryBankIspb'
  | 'createdAt'
> & {
  operationId: string;
};

export type WebhookTargetGatewayPaymentFailedRequest = Pick<
  Payment,
  | 'id'
  | 'endToEndId'
  | 'txId'
  | 'value'
  | 'ownerFullName'
  | 'ownerPersonType'
  | 'ownerDocument'
  | 'ownerAccountNumber'
  | 'ownerBranch'
  | 'beneficiaryName'
  | 'beneficiaryPersonType'
  | 'beneficiaryDocument'
  | 'beneficiaryBankName'
  | 'beneficiaryBankIspb'
  | 'createdAt'
> & {
  operationId: string;
  errorDescription: string;
  errorCode: string;
};

export type WebhookTargetGatewayDepositRequest = Pick<
  PixDeposit,
  | 'id'
  | 'endToEndId'
  | 'txId'
  | 'amount'
  | 'thirdPartName'
  | 'thirdPartPersonType'
  | 'thirdPartDocument'
  | 'thirdPartAccountNumber'
  | 'thirdPartBranch'
  | 'clientName'
  | 'clientAccountNumber'
  | 'clientPersonType'
  | 'clientDocument'
  | 'createdAt'
> & {
  operationId: string;
  thirdPartBankName: string;
  thirdPartBankIspb: string;
  clientBankName: string;
  clientBankIspb: string;
};

export type WebhookTargetGatewayPixDevolutionReceivedRequest = Pick<
  PixDevolutionReceived,
  | 'id'
  | 'endToEndId'
  | 'txId'
  | 'amount'
  | 'thirdPartName'
  | 'thirdPartPersonType'
  | 'thirdPartDocument'
  | 'thirdPartAccountNumber'
  | 'thirdPartBranch'
  | 'clientName'
  | 'clientPersonType'
  | 'clientDocument'
  | 'createdAt'
> & {
  operationId: string;
  thirdPartBankName: string;
  thirdPartBankIspb: string;
  clientBankName: string;
  clientBankIspb: string;
};

export type WebhookTargetGatewayPixDevolutionCompletedRequest = Pick<
  PixDevolution,
  'id' | 'endToEndId' | 'amount' | 'createdAt'
> & {
  operationId: string;
  txId: string;
  clientName: string;
  clientPersonType: string;
  clientDocument: string;
  clientAccountNumber: string;
  clientBranch: string;
  clientBankName: string;
  clientBankIspb: string;
  thirdPartName: string;
  thirdPartPersonType: string;
  thirdPartDocument: string;
  thirdPartBankName: string;
  thirdPartBankIspb: string;
};

export type WebhookTargetGatewayPixDevolutionFailedRequest = Pick<
  PixDevolution,
  'id' | 'endToEndId' | 'amount' | 'createdAt'
> & {
  operationId: string;
  txId: string;
  clientName: string;
  clientPersonType: string;
  clientDocument: string;
  clientAccountNumber: string;
  clientBranch: string;
  clientBankName: string;
  clientBankIspb: string;
  thirdPartName: string;
  thirdPartPersonType: string;
  thirdPartDocument: string;
  thirdPartBankName: string;
  thirdPartBankIspb: string;
  errorDescription: string;
  errorCode: string;
};

export type WebhookTargetGatewayPaymentCompletedRequest =
  WebhookTargetGatewayPaymentRequest;

export type WebhookTargetGatewayDepositReceivedRequest =
  WebhookTargetGatewayDepositRequest;

export type WebhookTargetGatewayResponse = {
  httpStatusCodeResponse: string;
};

export interface WebhookTargetGateway {
  sendDevolutionReceived(
    url: string,
    apiKey: string,
    data: WebhookTargetGatewayPixDevolutionReceivedRequest,
  ): Promise<WebhookTargetGatewayResponse>;

  sendPaymentCompleted(
    url: string,
    apiKey: string,
    data: WebhookTargetGatewayPaymentCompletedRequest,
  ): Promise<WebhookTargetGatewayResponse>;

  sendDepositReceived(
    url: string,
    apiKey: string,
    data: WebhookTargetGatewayDepositReceivedRequest,
  ): Promise<WebhookTargetGatewayResponse>;

  sendDevolutionCompleted(
    url: string,
    apiKey: string,
    data: WebhookTargetGatewayPixDevolutionCompletedRequest,
  ): Promise<WebhookTargetGatewayResponse>;

  sendPaymentFailed(
    url: string,
    apiKey: string,
    data: WebhookTargetGatewayPaymentFailedRequest,
  ): Promise<WebhookTargetGatewayResponse>;

  sendDevolutionFailed(
    url: string,
    apiKey: string,
    data: WebhookTargetGatewayPixDevolutionFailedRequest,
  ): Promise<WebhookTargetGatewayResponse>;
}
