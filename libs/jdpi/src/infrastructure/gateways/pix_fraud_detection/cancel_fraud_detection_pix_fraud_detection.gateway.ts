import { v4 as uuidV4 } from 'uuid';
import { AxiosInstance } from 'axios';
import { MissingDataException } from '@zro/common';
import { Logger } from 'winston';
import {
  OfflinePixPaymentPspException,
  PixFraudDetectionGateway,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
} from '@zro/jdpi/infrastructure';
import {
  JdpiErrorTypes,
  JdpiFraudDetectionStatus,
  JdpiPersonType,
  JdpiPixInfractionFraudType,
} from '@zro/jdpi/domain';
import {
  CancelFraudDetectionPixFraudDetectionPspRequest,
  CancelFraudDetectionPixFraudDetectionPspResponse,
} from '@zro/pix-payments/application/';
import { isDefined } from 'class-validator';

interface JdpiCancelFraudDetectionPixFraudDetectionPspRequest {
  idMarcacaoFraude: string;
  ispb: number;
}

interface JdpiCancelFraudDetectionPixFraudDetectionPspResponse {
  dtHrRetornoDict: Date;
  idCorrelacao: string;
  idMarcacaoFraude: string;
  tpPessoa: JdpiPersonType;
  cpfCnpj: number;
  chave?: string;
  tpFraude: JdpiPixInfractionFraudType;
  stMarcacaoFraude: JdpiFraudDetectionStatus;
  dtHrCriacaoMarcacaoFraude: Date;
  dtHrUltModificacao: Date;
}

export class JdpiCancelFraudDetectionPixFraudDetectionPspGateway
  implements Pick<PixFraudDetectionGateway, 'cancelFraudDetection'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
    private pspIspb: number,
  ) {
    this.logger = logger.child({
      context: JdpiCancelFraudDetectionPixFraudDetectionPspGateway.name,
    });
  }

  async cancelFraudDetection(
    request: CancelFraudDetectionPixFraudDetectionPspRequest,
  ): Promise<CancelFraudDetectionPixFraudDetectionPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiCancelFraudDetectionPixFraudDetectionPspRequest = {
      idMarcacaoFraude: request.fraudDetectionId,
      ispb: this.pspIspb,
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': uuidV4(),
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response =
        await this.axios.post<JdpiCancelFraudDetectionPixFraudDetectionPspResponse>(
          JDPI_SERVICES.PIX_FRAUD_DETECTION.CANCEL(request.fraudDetectionId),
          payload,
          { headers },
        );

      this.logger.info('Response found.', { data: response.data });

      return {
        fraudDetectionId: response.data.idMarcacaoFraude,
        status:
          isDefined(response.data.stMarcacaoFraude) &&
          Sanitize.parseFraudDetectionStatus(response.data.stMarcacaoFraude),
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
