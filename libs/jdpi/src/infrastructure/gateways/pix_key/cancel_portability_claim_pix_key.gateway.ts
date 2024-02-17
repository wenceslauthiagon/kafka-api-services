import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  JdpiCanceledBy,
  JdpiReasonType,
  JdpiClaimStatusType,
  JdpiErrorTypes,
} from '@zro/jdpi/domain';
import {
  OfflinePixKeyPspException,
  PixKeyPspException,
  PixKeyGateway,
  CancelPortabilityClaimPspRequest,
  CancelPortabilityClaimPspResponse,
} from '@zro/pix-keys/application';
import {
  JdpiAuthGateway,
  JDPI_SERVICES,
  Sanitize,
} from '@zro/jdpi/infrastructure';

interface JdpiCancelPortabilityRequest {
  idReivindicacao: string;
  ispb: number;
  motivo: JdpiReasonType;
  ehReivindicador?: boolean;
}

export interface JdpiCancelPortabilityResponse {
  idReivindicacao: string;
  stReivindicacao: JdpiClaimStatusType;
  motivoConfirmacao?: JdpiReasonType;
  motivoCancelamento?: JdpiReasonType;
  canceladaPor?: JdpiCanceledBy;
  dtHrLimiteResolucao: Date;
  dtHrLimiteConclusao?: Date;
  dtHrUltModificacao: Date;
}

export class JdpiCancelPortabilityPixKeyPspGateway
  implements Pick<PixKeyGateway, 'cancelPortabilityClaim'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: JdpiCancelPortabilityPixKeyPspGateway.name,
    });
  }

  async cancelPortabilityClaim(
    request: CancelPortabilityClaimPspRequest,
  ): Promise<CancelPortabilityClaimPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiCancelPortabilityRequest = {
      idReivindicacao: request.claimId,
      ispb: Sanitize.parseIspb(request.ispb),
      motivo: Sanitize.parseClaimReason(request.reason),
      ehReivindicador: request.isClaimOwner,
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': request.claimId,
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response = await this.axios.post<JdpiCancelPortabilityResponse>(
        JDPI_SERVICES.PIX_KEY.CLAIMS_CANCEL(request.claimId),
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
