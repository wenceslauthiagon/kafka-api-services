import { CreateExchangeContractGateway } from './create.gateway';
import { GetAllExchangeContractGateway as GetAllExchangeContractGateway } from './get_all.gateway';
import { GetExchangeContractByIdGateway } from './get_by_id.gateway';

export type ExchangeContractGateway = CreateExchangeContractGateway &
  GetAllExchangeContractGateway &
  GetExchangeContractByIdGateway;
