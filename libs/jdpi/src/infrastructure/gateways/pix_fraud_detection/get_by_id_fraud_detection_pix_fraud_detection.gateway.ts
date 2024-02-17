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
  GetByIdFraudDetectionPixFraudDetectionPspRequest,
  GetByIdFraudDetectionPixFraudDetectionPspResponse,
} from '@zro/pix-payments/application/';
import { isDefined } from 'class-validator';

interface JdpiGetByIdFraudDetectionPixFraudDetectionPspRequest {
  idMarcacaoFraude: string;
}

interface JdpiGetByIdFraudDetectionPixFraudDetectionPspResponse {
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

export class JdpiGetByIdFraudDetectionPixFraudDetectionPspGateway
  implements Pick<PixFraudDetectionGateway, 'getByIdFraudDetection'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
    private pspIspb: number,
  ) {
    this.logger = logger.child({
      context: JdpiGetByIdFraudDetectionPixFraudDetectionPspGateway.name,
    });
  }

  async getByIdFraudDetection(
    request: GetByIdFraudDetectionPixFraudDetectionPspRequest,
  ): Promise<GetByIdFraudDetectionPixFraudDetectionPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const params: JdpiGetByIdFraudDetectionPixFraudDetectionPspRequest = {
      idMarcacaoFraude: request.fraudDetectionId,
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'PI-RequestingParticipant': this.pspIspb,
    };

    this.logger.info('Request params.', { params });

    try {
      const response =
        await this.axios.get<JdpiGetByIdFraudDetectionPixFraudDetectionPspResponse>(
          JDPI_SERVICES.PIX_FRAUD_DETECTION.GET_BY_ID(request.fraudDetectionId),
          { headers },
        );

      this.logger.info('Response found.', { data: response.data });

      const personType = Sanitize.getPersonType(response.data.tpPessoa);

      return {
        fraudDetectionId: response.data.idMarcacaoFraude,
        personType: personType,
        document: Sanitize.getDocument(response.data.cpfCnpj, personType),
        key: response.data.chave,
        fraudType:
          isDefined(response.data.tpFraude) &&
          Sanitize.getFraudType(response.data.tpFraude),
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
