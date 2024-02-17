import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { JdpiClaimStatusType, JdpiErrorTypes } from '@zro/jdpi/domain';
import {
  OfflinePixKeyPspException,
  PixKeyPspException,
  PixKeyGateway,
  FinishClaimPixKeyPspRequest,
  FinishClaimPixKeyPspResponse,
} from '@zro/pix-keys/application';
import {
  JdpiAuthGateway,
  JDPI_SERVICES,
  Sanitize,
} from '@zro/jdpi/infrastructure';

interface JdpiFinishClaimPixKeyRequest {
  idReivindicacao: string;
  ispb: number;
}

interface JdpiFinishClaimPixKeyResponse {
  idReivindicacao: string;
  stReivindicacao: JdpiClaimStatusType;
  motivoConfirmacao?: number;
  motivoCancelamento?: number;
  canceladaPor?: number;
  dtHrCriacaoChave?: string;
  dtHrInicioPosseChave?: string;
  dtHrLimiteResolucao: string;
  dtHrLimiteConclusao?: string;
  dtHrUltModificacao: string;
}

export class JdpiFinishClaimPixKeyPspGateway
  implements Pick<PixKeyGateway, 'finishClaimPixKey'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: JdpiFinishClaimPixKeyPspGateway.name,
    });
  }

  async finishClaimPixKey(
    request: FinishClaimPixKeyPspRequest,
  ): Promise<FinishClaimPixKeyPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiFinishClaimPixKeyRequest = {
      idReivindicacao: request.claimId,
      ispb: Sanitize.parseIspb(request.ispb),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': request.claimId,
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response = await this.axios.post<JdpiFinishClaimPixKeyResponse>(
        JDPI_SERVICES.PIX_KEY.CLAIM_FINISH(request.claimId),
        payload,
        { headers },
      );

      this.logger.info('Response found.', { data: response.data });

      return {
        key: request.key,
        keyType: request.keyType,
      };
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
            throw new OfflinePixKeyPspException(error);
          default: // AuthorizationError, InternalServerError
        }
      }

      this.logger.error('Unexpected Jdpi gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new PixKeyPspException(error);
    }
  }
}
