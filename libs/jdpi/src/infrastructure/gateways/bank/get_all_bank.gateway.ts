import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { JdpiErrorTypes } from '@zro/jdpi/domain';
import {
  GetAllBankPspResponse,
  BankGateway,
  BankPspException,
  OfflineBankPspException,
} from '@zro/banking/application';
import {
  JdpiAuthGateway,
  JDPI_SERVICES,
  Sanitize,
} from '@zro/jdpi/infrastructure';

enum JdpiBankStatus {
  ACTIVE = 1,
  INACTIVE = 2,
  PENDING = 3,
  FAILED = 4,
}

interface JdpiGetAllBankPspResult {
  ispb: number;
  razaoSocial?: string;
  nomeReduzido: string;
  tpPsp: number;
  modalidade?: number;
  dtHrInicioPsp?: Date;
  dtHrFimPsp?: Date;
  stPsp: JdpiBankStatus;
}

interface JdpiGetAllBankPspResponse {
  resultado: JdpiGetAllBankPspResult[];
}

export class JdpiGetAllBankPspGateway
  implements Pick<BankGateway, 'getAllBank'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({ context: JdpiGetAllBankPspGateway.name });
  }

  async getAllBank(): Promise<GetAllBankPspResponse[]> {
    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
    };

    this.logger.info('Request data.');

    try {
      const response = await this.axios.get<JdpiGetAllBankPspResponse>(
        JDPI_SERVICES.BANK.LIST,
        { headers },
      );

      this.logger.info('Response found.', { data: response.data });

      return response.data.resultado
        .filter((item) => item.stPsp === JdpiBankStatus.ACTIVE)
        .map((item) => ({
          ispb: Sanitize.getIspb(item.ispb),
          fullName: Sanitize.clearName(item.razaoSocial ?? item.nomeReduzido),
          name: Sanitize.clearName(item.nomeReduzido),
          startedAt: item.dtHrInicioPsp
            ? new Date(item.dtHrInicioPsp)
            : new Date(),
        }));
    } catch (error) {
      this.logger.error('ERROR Jdpi request.', {
        error: error.isAxiosError ? error.message : error,
      });

      if (error.response?.data) {
        this.logger.error('ERROR Jdpi response data.', {
          error: error.response.data,
        });

        const { codigo } = error.response.data;

        switch (codigo) {
          case JdpiErrorTypes.INTERNAL_SERVER_ERROR:
          case JdpiErrorTypes.SERVICE_UNAVAILABLE:
            throw new OfflineBankPspException(error);
          default: // AuthorizationError, InternalServerError
        }
      }

      this.logger.error('Unexpected Jdpi gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new BankPspException(error);
    }
  }
}
