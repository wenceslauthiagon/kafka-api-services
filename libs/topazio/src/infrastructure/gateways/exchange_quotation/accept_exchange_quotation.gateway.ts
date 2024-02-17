import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  AcceptExchangeQuotationRequest,
  AcceptExchangeQuotationResponse,
  ExchangeQuotationGateway,
  ExchangeQuotationPspException,
  OfflineExchangeQuotationPspException,
} from '@zro/otc/application';
import {
  TopazioAuthGateway,
  TOPAZIO_SERVICES,
} from '@zro/topazio/infrastructure';

interface TopazioAcceptExchangeQuotationParamsRequest {
  id: string;
}
interface TopazioAcceptExchangeQuotationPayloadRequest {
  quotationId: string;
}

interface TopazioAcceptExchangeQuotationResponse {
  resultSet: string;
}

export class TopazioAcceptExchangeQuotationGateway
  implements Pick<ExchangeQuotationGateway, 'acceptExchangeQuotation'>
{
  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: TopazioAcceptExchangeQuotationGateway.name,
    });
  }

  async acceptExchangeQuotation(
    request: AcceptExchangeQuotationRequest,
  ): Promise<AcceptExchangeQuotationResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const params: TopazioAcceptExchangeQuotationParamsRequest = {
      id: request.solicitationPspId,
    };

    const payload: TopazioAcceptExchangeQuotationPayloadRequest = {
      quotationId: request.quotationPspId,
    };

    const headers = {
      access_token: await TopazioAuthGateway.getAccessToken(this.logger),
    };

    this.logger.info('Request payload and params.', {
      payload,
      params,
    });

    try {
      const response =
        await this.axios.put<TopazioAcceptExchangeQuotationResponse>(
          `${TOPAZIO_SERVICES.EXCHANGE_QUOTATION.TRADE}/${params.id}`,
          payload,
          { headers },
        );

      this.logger.info('Response found.', { data: response.data });

      return {
        isAccepted: response.data.resultSet?.includes('success') ? true : false,
      };
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
