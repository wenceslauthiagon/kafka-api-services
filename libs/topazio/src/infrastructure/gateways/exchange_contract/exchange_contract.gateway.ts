import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  CreateExchangeContractRequest,
  CreateExchangeContractResponse,
  ExchangeContractGateway,
  GetExchangeContractByIdRequest,
  GetExchangeContractByIdResponse,
  GetAllExchangeContractRequest,
  GetAllExchangeContractResponse,
} from '@zro/otc/application';
import {
  TopazioCreateExchangeContractGateway,
  TopazioGetAllExchangeContractGateway,
  TopazioGetByIdExchangeContractGateway,
} from '@zro/topazio';

export class TopazioExchangeContractGateway implements ExchangeContractGateway {
  constructor(
    private logger: Logger,
    private topazioExchangeContract: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: TopazioExchangeContractGateway.name,
    });
  }

  async createExchangeContract(
    request: CreateExchangeContractRequest,
  ): Promise<CreateExchangeContractResponse> {
    this.logger.debug('Create exchange contract request.', { request });

    const gateway = new TopazioCreateExchangeContractGateway(
      this.logger,
      this.topazioExchangeContract,
    );

    return gateway.createExchangeContract(request);
  }

  async getAllExchangeContract(
    request: GetAllExchangeContractRequest,
  ): Promise<GetAllExchangeContractResponse> {
    this.logger.debug('Get all exchange contract request.', { request });

    const gateway = new TopazioGetAllExchangeContractGateway(
      this.logger,
      this.topazioExchangeContract,
    );

    return gateway.getAllExchangeContract(request);
  }

  async getExchangeContractById(
    request: GetExchangeContractByIdRequest,
  ): Promise<GetExchangeContractByIdResponse> {
    this.logger.debug('Get exchange contract by id request.', { request });

    const gateway = new TopazioGetByIdExchangeContractGateway(
      this.logger,
      this.topazioExchangeContract,
    );

    return gateway.getExchangeContractById(request);
  }
}
