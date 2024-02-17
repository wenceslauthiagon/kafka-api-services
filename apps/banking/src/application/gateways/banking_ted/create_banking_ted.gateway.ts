export interface CreateBankingTedPspRequest {
  transactionId: string;
  ownerDocument: string;
  ownerName: string;
  ownerAccount: string;
  beneficiaryDocument: string;
  beneficiaryName: string;
  beneficiaryBankCode: string;
  beneficiaryAgency: string;
  beneficiaryAccount: string;
  beneficiaryAccountDigit: string;
  beneficiaryAccountType: string;
  amount: number;
  purposeCode: number;
  description?: string;
  callbackUrl: string;
}

export interface CreateBankingTedPspResponse {
  transactionId: string;
}

export interface CreateBankingTedPspGateway {
  createBankingTed(
    data: CreateBankingTedPspRequest,
  ): Promise<CreateBankingTedPspResponse>;
}
