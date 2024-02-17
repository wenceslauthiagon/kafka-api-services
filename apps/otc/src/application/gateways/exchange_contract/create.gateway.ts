export type CreateExchangeContractRequest = {
  tradeIds: string[];
  externalName: string;
  externalIban: string;
  externalAddress: string;
  intermBankSwift?: string;
  intermBankCity?: string;
  intermBankName?: string;
  intermBankAba?: string;
  receiverBankSwift: string;
  receiverBankCity: string;
  receiverBankAba?: string;
  receiverBankName: string;
  nature: number;
  country: number;
  averageBankFxRate?: number;
  averageFxRate?: number;
  averageSpot?: number;
  clientReference?: string;
};

export interface CreateExchangeContractResponse {
  id: string;
  intermBankSwift: string;
  receiverBankSwift: string;
  receiverBankCity: string;
  externalName: string;
  externalAddress: string;
  externalIban: string;
  internalDocument: string;
  internalSettlementDate: Date;
  externalSettlementDate: Date;
  nature: number;
  fxRate: number;
  internalValue: number;
  externalValue: number;
  iofValue: number;
  createdDate: Date;
  country: number;
  status: string;
  tradeIds: string[];
}

export interface CreateExchangeContractGateway {
  createExchangeContract(
    data: CreateExchangeContractRequest,
  ): Promise<CreateExchangeContractResponse>;
}
