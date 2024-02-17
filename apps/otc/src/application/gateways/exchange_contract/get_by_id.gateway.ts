export type GetExchangeContractByIdRequest = {
  id: string;
  page: number;
  perPage: number;
};

export interface GetExchangeContractByIdResponseItem {
  id: string;
  intermBankSwift: string;
  intermBankCity: string;
  intermBankName: string;
  intermBankAba: string;
  receiverBankSwift: string;
  receiverBankCity: string;
  receiverBankAba: string;
  receiverBankName: string;
  externalName: string;
  externalAddress: string;
  externalIban: string;
  internalSettlementDate: Date;
  externalSettlementDate: Date;
  nature: number;
  country: number;
  fxRate: number;
  internalValue: number;
  externalValue: number;
  iofValue: number;
  createdDate: Date;
  status: string;
  clientReference: string;
  tradeIds: string[];
}

export interface GetExchangeContractByIdResponse {
  resultSet: GetExchangeContractByIdResponseItem[];
  page: number;
  perPage: number;
  totalRegisters: number;
  totalPages: number;
}

export interface GetExchangeContractByIdGateway {
  getExchangeContractById(
    data: GetExchangeContractByIdRequest,
  ): Promise<GetExchangeContractByIdResponse>;
}
