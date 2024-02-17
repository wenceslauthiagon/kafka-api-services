//TODO add fields to send jira
export interface CreatePixRefundPspRequest {
  requesterIspb: string;
  responderIspb: string;
}

//TODO add fields to receive jira
export interface CreatePixRefundPspResponse {
  issueId: number;
}

export interface CreatePixRefundPspGateway {
  createRefundRequest(
    request: CreatePixRefundPspRequest,
  ): Promise<CreatePixRefundPspResponse>;
}
