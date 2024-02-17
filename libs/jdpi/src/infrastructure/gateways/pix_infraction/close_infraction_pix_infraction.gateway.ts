import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import { MissingDataException } from '@zro/common';
import {
  CloseInfractionPixInfractionPspRequest,
  CloseInfractionPixInfractionPspResponse,
  OfflinePixPaymentPspException,
  PixPaymentPspException,
  CloseInfractionPixInfractionPspGateway,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  JDPI_SERVICES,
  Sanitize,
} from '@zro/jdpi/infrastructure';
import {
  JdpiErrorTypes,
  JdpiPixInfractionStatus,
  JdpiPixInfractionAnalysisResultType,
  JdpiPixInfractionFraudType,
} from '@zro/jdpi/domain';
import { PixInfractionAnalysisResultType } from '@zro/pix-payments/domain';

interface JdpiCloseInfractionPixInfractionPspRequest {
  idRelatoInfracao: string;
  ispb: number;
  tpFraude?: JdpiPixInfractionFraudType; // Obligatory when "resultadoAnalise" is "0 - agreed".
  resultadoAnalise: JdpiPixInfractionAnalysisResultType;
  detalhesAnalise?: string;
}

interface JdpiCloseInfractionPixInfractionPspResponse {
  endToEndId: string;
  idRelatoInfracao: string;
  stRelatoInfracao: JdpiPixInfractionStatus;
  dtHrCriacaoRelatoInfracao: Date;
  dtHrUltModificacao: Date;
}

export class JdpiCloseInfractionPixInfractionPspGateway
  implements CloseInfractionPixInfractionPspGateway
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
    private pspIspb: number,
  ) {
    this.logger = logger.child({
      context: JdpiCloseInfractionPixInfractionPspGateway.name,
    });
  }

  async closeInfraction(
    request: CloseInfractionPixInfractionPspRequest,
  ): Promise<CloseInfractionPixInfractionPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiCloseInfractionPixInfractionPspRequest = {
      idRelatoInfracao: request.infractionId,
      ispb: this.pspIspb,
      ...(request.analysisResult === PixInfractionAnalysisResultType.AGREED && {
        tpFraude: JdpiPixInfractionFraudType.OTHER,
      }),
      resultadoAnalise: Sanitize.parseInfractionAnalysisResultType(
        request.analysisResult,
      ),
      ...(request.analysisDetails && {
        detalhesAnalise: request.analysisDetails,
      }),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': request.infractionId,
    };

    this.logger.info('Request payload and headers.', { payload });

    try {
      const response =
        await this.axios.post<JdpiCloseInfractionPixInfractionPspResponse>(
          JDPI_SERVICES.PIX_INFRACTION.CLOSE,
          payload,
          { headers },
        );

      this.logger.info('Response found.', { data: response.data });

      return {
        infractionId: response.data.idRelatoInfracao,
        operationTransactionEndToEndId: response.data.endToEndId,
        status:
          isDefined(response.data.stRelatoInfracao) &&
          Sanitize.getInfractionStatus(response.data.stRelatoInfracao),
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
