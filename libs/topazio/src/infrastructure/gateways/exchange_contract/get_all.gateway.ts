import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  ExchangeContractGateway,
  ExchangeContractPspException,
  GetAllExchangeContractRequest,
  GetAllExchangeContractResponse,
  OfflineExchangeContractPspException,
} from '@zro/otc/application';
import {
  TopazioAuthGateway,
  TOPAZIO_SERVICES,
} from '@zro/topazio/infrastructure';

interface TopazioGetAllExchangeContractRequest {
  id?: string;
  status?: string;
  createdDate?: Date;
  internalDocument?: string;
  startDate?: Date;
  endDate?: Date;
}

interface TopazioGetAllExchangeContractResponseItem {
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

interface TopazioGetAllExchangeContractResponse {
  resultSet: TopazioGetAllExchangeContractResponseItem[];
  page: number;
  perPage: number;
  totalRegisters: number;
  totalPages: number;
}

export class TopazioGetAllExchangeContractGateway
  implements Pick<ExchangeContractGateway, 'getAllExchangeContract'>
{
  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: TopazioGetAllExchangeContractGateway.name,
    });
  }

  async getAllExchangeContract(
    request: GetAllExchangeContractRequest,
  ): Promise<GetAllExchangeContractResponse> {
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const headers = {
      access_token: await TopazioAuthGateway.getAccessToken(this.logger),
      page: request.page,
      per_page: request.perPage,
    };

    const params: TopazioGetAllExchangeContractRequest = {
      id: request.id,
      status: request.status,
      createdDate: request.createdDate,
      internalDocument: request.internalDocument,
      startDate: request.startDate,
      endDate: request.endDate,
    };

    try {
      const response =
        await this.axios.get<TopazioGetAllExchangeContractResponse>(
          TOPAZIO_SERVICES.EXCHANGE_CONTRACT.CONTRACT,
          { headers, params },
        );

      this.logger.debug('Topazio exchange contract response.', {
        data: response.data,
      });

      const resultSet = response.data.resultSet.map((item) => ({
        id: item.id,
        intermBankSwift: item.intermBankSwift,
        intermBankCity: item.intermBankCity,
        intermBankName: item.intermBankName,
        intermBankAba: item.intermBankAba,
        receiverBankSwift: item.receiverBankSwift,
        receiverBankCity: item.receiverBankCity,
        receiverBankAba: item.receiverBankAba,
        receiverBankName: item.receiverBankName,
        externalName: item.externalName,
        externalAddress: item.externalAddress,
        externalIban: item.externalIban,
        internalSettlementDate: item.internalSettlementDate,
        externalSettlementDate: item.externalSettlementDate,
        nature: item.nature,
        country: item.country,
        fxRate: item.fxRate,
        internalValue: item.internalValue,
        externalValue: item.externalValue,
        iofValue: item.iofValue,
        createdDate: item.createdDate,
        status: item.status,
        clientReference: item.clientReference,
        tradeIds: item.tradeIds,
      }));

      return {
        resultSet,
        page: response.data.page,
        perPage: response.data.perPage,
        totalRegisters: response.data.totalRegisters,
        totalPages: response.data.totalPages,
      };
    } catch (error) {
      this.logger.error('ERROR Topazio request.', {
        error: error.isAxiosError ? error.message : error,
      });

      const parseMessage = (message: string) => {
        if (!message) return;

        if (message.startsWith('An error occurred while sending the request')) {
          throw new OfflineExchangeContractPspException(error);
        } else if (message.startsWith('No such host is known')) {
          throw new OfflineExchangeContractPspException(error);
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
      throw new ExchangeContractPspException(error);
    }
  }
}
