import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  ExchangeQuotationGateway,
  CreateExchangeQuotationRequest,
  CreateExchangeQuotationResponse,
  AcceptExchangeQuotationRequest,
  AcceptExchangeQuotationResponse,
  RejectExchangeQuotationRequest,
  GetExchangeQuotationByPspIdResponse,
  GetExchangeQuotationByPspIdRequest,
} from '@zro/otc/application';
import {
  TopazioCreateExchangeQuotationGateway,
  TopazioAcceptExchangeQuotationGateway,
  TopazioRejectExchangeQuotationGateway,
  TopazioGetExchangeQuotationByIdGateway,
} from '@zro/topazio';

export class TopazioExchangeQuotationGateway
  implements ExchangeQuotationGateway
{
  constructor(
    private logger: Logger,
    private topazioExchangeQuotation: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: TopazioExchangeQuotationGateway.name,
    });
  }

  async createExchangeQuotation(
    request: CreateExchangeQuotationRequest,
  ): Promise<CreateExchangeQuotationResponse> {
    this.logger.debug('Create exchange quotation request.', { request });

    const gateway = new TopazioCreateExchangeQuotationGateway(
      this.logger,
      this.topazioExchangeQuotation,
    );

    return gateway.createExchangeQuotation(request);
  }

  async acceptExchangeQuotation(
    request: AcceptExchangeQuotationRequest,
  ): Promise<AcceptExchangeQuotationResponse> {
    this.logger.debug('Accept exchange quotation request.', { request });

    const gateway = new TopazioAcceptExchangeQuotationGateway(
      this.logger,
      this.topazioExchangeQuotation,
    );

    return gateway.acceptExchangeQuotation(request);
  }

  async rejectExchangeQuotation(
    request: RejectExchangeQuotationRequest,
  ): Promise<void> {
    this.logger.debug('Reject exchange quotation request.', { request });

    const gateway = new TopazioRejectExchangeQuotationGateway(
      this.logger,
      this.topazioExchangeQuotation,
    );

    return gateway.rejectExchangeQuotation(request);
  }

  async getExchangeQuotationById(
    request: GetExchangeQuotationByPspIdRequest,
  ): Promise<GetExchangeQuotationByPspIdResponse> {
    this.logger.debug('Get exchange quotation by id request.', { request });

    const gateway = new TopazioGetExchangeQuotationByIdGateway(
      this.logger,
      this.topazioExchangeQuotation,
    );

    return gateway.getExchangeQuotationById(request);
  }
}
