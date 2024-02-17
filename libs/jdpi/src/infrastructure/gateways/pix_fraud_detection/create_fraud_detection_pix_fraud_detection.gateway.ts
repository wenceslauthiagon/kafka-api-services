import { v4 as uuidV4 } from 'uuid';
import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  OfflinePixPaymentPspException,
  PixPaymentPspException,
  CreateFraudDetectionPixFraudDetectionPspRequest,
  CreateFraudDetectionPixFraudDetectionPspResponse,
  PixFraudDetectionGateway,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  JDPI_SERVICES,
  Sanitize,
} from '@zro/jdpi/infrastructure';
import {
  JdpiErrorTypes,
  JdpiPersonType,
  JdpiFraudDetectionStatus,
  JdpiPixInfractionFraudType,
} from '@zro/jdpi/domain';
import { isDefined } from 'class-validator';

interface JdpiCreateFraudDetectionPixFraudDetectionPspRequest {
  ispb: number;
  tpPessoa: JdpiPersonType;
  cpfCnpj: number;
  tpFraude: JdpiPixInfractionFraudType;
  chave?: string;
}

interface JdpiCreateFraudDetectionPixFraudDetectionPspResponse {
  dtHrRetornoDict: string;
  idCorrelacao: string;
  idMarcacaoFraude: string;
  stMarcacaoFraude: JdpiFraudDetectionStatus;
  dtHrCriacaoMarcacaoFraude: string;
  dtHrUltModificacao: string;
}

export class JdpiCreateFraudDetectionPixFraudDetectionPspGateway
  implements Pick<PixFraudDetectionGateway, 'createFraudDetection'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
    private pspIspb: number,
  ) {
    this.logger = logger.child({
      context: JdpiCreateFraudDetectionPixFraudDetectionPspGateway.name,
    });
  }

  async createFraudDetection(
    request: CreateFraudDetectionPixFraudDetectionPspRequest,
  ): Promise<CreateFraudDetectionPixFraudDetectionPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiCreateFraudDetectionPixFraudDetectionPspRequest = {
      ispb: this.pspIspb,
      tpPessoa:
        isDefined(request.personType) &&
        Sanitize.parsePersonType(request.personType),
      cpfCnpj:
        isDefined(request.document) && Sanitize.parseDocument(request.document),
      tpFraude:
        isDefined(request.fraudType) &&
        Sanitize.parseFraudType(request.fraudType),
      chave: request.key,
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': uuidV4(),
    };

    this.logger.info('Request payload and headers.', { payload });

    try {
      const response =
        await this.axios.post<JdpiCreateFraudDetectionPixFraudDetectionPspResponse>(
          JDPI_SERVICES.PIX_FRAUD_DETECTION.CREATE,
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
