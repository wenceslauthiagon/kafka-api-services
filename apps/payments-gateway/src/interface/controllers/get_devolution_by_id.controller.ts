import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { HttpStatus } from '@nestjs/common';
import { ForbiddenException } from '@zro/common';
import {
  PaymentsGatewayException,
  TransactionNotFoundException,
  PAYMENTS_GATEWAY_SERVICES,
} from '@zro/payments-gateway/application';
import { GetTransactionByIdRequest, TransactionResponseItem } from './default';

export class GetDevolutionByIdController {
  constructor(
    private logger: Logger,
    readonly axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: GetDevolutionByIdController.name,
    });
  }

  async execute(
    request: GetTransactionByIdRequest,
  ): Promise<TransactionResponseItem> {
    this.logger.debug('Get devolution by id request.', { request });

    const { id } = request;

    try {
      const result = await this.axiosInstance.get<TransactionResponseItem>(
        `${PAYMENTS_GATEWAY_SERVICES.DEVOLUTION}/${id}`,
      );

      this.logger.debug('Response found.', { data: result.data });

      if (!result.data) return null;

      const response = new TransactionResponseItem(result.data);

      this.logger.info('Get devolution by id response.', {
        response,
      });

      return response;
    } catch (error) {
      if (
        error.isAxiosError &&
        error.response.status === HttpStatus.NOT_FOUND &&
        error.response.data
      ) {
        throw new TransactionNotFoundException(error.response.data);
      } else if (
        error.isAxiosError &&
        error.response.status === HttpStatus.FORBIDDEN
      ) {
        throw new ForbiddenException(error.response.data);
      }

      this.logger.error('Unexpected payments gateway error.', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });

      throw new PaymentsGatewayException(error);
    }
  }
}
