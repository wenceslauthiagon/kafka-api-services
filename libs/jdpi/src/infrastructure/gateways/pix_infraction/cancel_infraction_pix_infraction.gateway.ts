import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import { MissingDataException } from '@zro/common';
import { JdpiPixInfractionStatus, JdpiErrorTypes } from '@zro/jdpi/domain';
import {
  OfflinePixPaymentPspException,
  PixPaymentPspException,
  CancelInfractionPixInfractionPspGateway,
  CancelInfractionPixInfractionPspRequest,
  CancelInfractionPixInfractionPspResponse,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
} from '@zro/jdpi/infrastructure';

interface JdpiCancelInfractionPixInfractionRequest {
  idRelatoInfracao: string;
  ispb: number;
}

interface JdpiCancelInfractionPixInfractionResponse {
  endToEndId: string;
  idRelatoInfracao: string;
  stRelatoInfracao: JdpiPixInfractionStatus;
  dtHrCriacaoRelatoInfracao: string;
  dtHrUltModificacao: string;
}

export class JdpiCancelInfractionPixInfractionPspGateway
  implements CancelInfractionPixInfractionPspGateway
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
    private pspIspb: number,
  ) {
    this.logger = logger.child({
      context: JdpiCancelInfractionPixInfractionPspGateway.name,
    });
  }

  async cancelInfraction(
    request: CancelInfractionPixInfractionPspRequest,
  ): Promise<CancelInfractionPixInfractionPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiCancelInfractionPixInfractionRequest = {
      idRelatoInfracao: request.infractionId,
      ispb: this.pspIspb,
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': request.infractionId,
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response =
        await this.axios.post<JdpiCancelInfractionPixInfractionResponse>(
          JDPI_SERVICES.PIX_INFRACTION.CANCEL,
          payload,
          { headers },
        );

      this.logger.info('Response found.', { data: response.data });

      return {
        infractionId: response.data.idRelatoInfracao,
        status:
          isDefined(response.data.stRelatoInfracao) &&
          Sanitize.getInfractionStatus(response.data.stRelatoInfracao),
        operationTransactionEndToEndId: response.data.endToEndId,
      };
    } catch (error) {
      this.logger.error('ERROR Jdpi request.', {
        error: error.isAxiosError ? error.message : error,
      });

      if (error.response?.data?.codigo) {
        this.logger.error('ERROR Jdpi response data.', {
          error: error.response.data,
        });

        const { codigo } = error.response.data;

        switch (codigo) {
          case JdpiErrorTypes.INTERNAL_SERVER_ERROR:
          case JdpiErrorTypes.SERVICE_UNAVAILABLE:
            throw new OfflinePixPaymentPspException(error);
          default: // AuthorizationError, InternalServerError
        }
      }

      this.logger.error('Unexpected Jdpi gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });

      throw new PixPaymentPspException(error);
    }
  }
}
