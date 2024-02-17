import { GetExchangeContractByIdResponseItem } from './get_by_id.gateway';

export type GetAllExchangeContractRequest = {
  id?: string;
  status?: string;
  createdDate?: Date;
  internalDocument?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  perPage: number;
};

export interface GetAllExchangeContractResponse {
  resultSet: GetExchangeContractByIdResponseItem[];
  page: number;
  perPage: number;
  totalRegisters: number;
  totalPages: number;
}

export interface GetAllExchangeContractGateway {
  getAllExchangeContract(
    data: GetAllExchangeContractRequest,
  ): Promise<GetAllExchangeContractResponse>;
}
