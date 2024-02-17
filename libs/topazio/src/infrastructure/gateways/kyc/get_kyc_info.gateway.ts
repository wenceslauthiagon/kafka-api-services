import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { PersonType } from '@zro/users/domain';
import {
  GetKycInfoRequest,
  GetKycInfoResponse,
  KycGateway,
  OfflinePixPaymentPspException,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  TopazioAuthGateway,
  Sanitize,
  TOPAZIO_SERVICES,
} from '@zro/topazio/infrastructure';

type TopazioGetKycInfoRequest = {
  dataSets: string;
  document: string;
};

type TopazioGetKycInfoPeopleResponse = {
  Name: string;
};

type TopazioGetKycInfoCompaniesResponse = {
  TradeName?: string;
  OfficialName: string;
};

export class TopazioGetKycInfoGateway
  implements Pick<KycGateway, 'getKycInfo'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: TopazioGetKycInfoGateway.name,
    });
  }

  async getKycInfo(request: GetKycInfoRequest): Promise<GetKycInfoResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: TopazioGetKycInfoRequest = {
      dataSets: 'basic_data',
      document: Sanitize.document(request.document),
    };

    const headers = {
      access_token: await TopazioAuthGateway.getAccessToken(this.logger),
    };

    this.logger.info('Request payload.', { payload });

    try {
      if (request.personType === PersonType.NATURAL_PERSON) {
        const response = await this.axios.post<TopazioGetKycInfoPeopleResponse>(
          TOPAZIO_SERVICES.KYC.PEOPLE,
          payload,
          { headers },
        );

        this.logger.info('Response found.', { data: response.data });

        return {
          name: response.data.Name && Sanitize.fullName(response.data.Name),
          props: response.data,
        };
      } else {
        const response =
          await this.axios.post<TopazioGetKycInfoCompaniesResponse>(
            TOPAZIO_SERVICES.KYC.COMPANIES,
            payload,
            { headers },
          );

        this.logger.info('Response found.', { data: response.data });

        return {
          name: response.data.OfficialName
            ? Sanitize.fullName(response.data.OfficialName)
            : null,
          tradeName: response.data.TradeName
            ? Sanitize.fullName(response.data.TradeName)
            : null,
          props: response.data,
        };
      }
    } catch (error) {
      this.logger.error('ERROR Topazio request.', {
        error: error.isAxiosError ? error.message : error,
      });

      const parseMessage = (message: string) => {
        if (!message) return;

        if (message.startsWith('An error occurred while sending the request')) {
          throw new OfflinePixPaymentPspException(error);
        } else if (message.startsWith('No such host is known')) {
          throw new OfflinePixPaymentPspException(error);
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
      throw new PixPaymentPspException(error);
    }
  }
}
