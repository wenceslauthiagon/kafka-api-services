import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  RejectExchangeQuotationRequest,
  ExchangeQuotationGateway,
  ExchangeQuotationPspException,
  OfflineExchangeQuotationPspException,
} from '@zro/otc/application';
import {
  TopazioAuthGateway,
  TOPAZIO_SERVICES,
} from '@zro/topazio/infrastructure';

interface TopazioRejectExchangeQuotationParamsRequest {
  id: string;
}

export class TopazioRejectExchangeQuotationGateway
  implements Pick<ExchangeQuotationGateway, 'rejectExchangeQuotation'>
{
  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: TopazioRejectExchangeQuotationGateway.name,
    });
  }

  async rejectExchangeQuotation(
    request: RejectExchangeQuotationRequest,
  ): Promise<void> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const params: TopazioRejectExchangeQuotationParamsRequest = {
      id: request.solicitationPspId,
    };

    const headers = {
      access_token: await TopazioAuthGateway.getAccessToken(this.logger),
    };

    this.logger.info('Request params.', { params });

    try {
      const response = await this.axios.delete<void>(
        `${TOPAZIO_SERVICES.EXCHANGE_QUOTATION.TRADE}/${params.id}`,
        { headers },
      );

      this.logger.info('Response found.', { data: response.data });
    } catch (error) {
      this.logger.error('ERROR Topazio request.', {
        error: error.isAxiosError ? error.message : error,
      });

      const parseMessage = (message: string) => {
        if (!message) return;

        if (message.startsWith('An error occurred while sending the request')) {
          throw new OfflineExchangeQuotationPspException(error);
        } else if (message.startsWith('No such host is known')) {
          throw new OfflineExchangeQuotationPspException(error);
        }
      };

      if (error.response?.data) {
        this.logger.error('ERROR Topazio response data.', {
          error: error.response.data,
        });

        const { type, message, errors } = error.response.data;
        switch (type) {
          case 'ValidationError':
            const messages = Array.isArray(errors)
              ? errors.map((e) => e.message)
              : [message];

            messages.forEach(parseMessage);
            break;
          default: // AuthorizationError, NotFoundError, InternalServerError
        }
      }

      this.logger.error('Unexpected Topazio gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new ExchangeQuotationPspException(error);
    }
  }
}
