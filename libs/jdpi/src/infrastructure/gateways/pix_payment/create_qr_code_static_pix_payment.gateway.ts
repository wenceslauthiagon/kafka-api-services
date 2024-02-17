import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { isDefined } from 'class-validator';
import { MissingDataException } from '@zro/common';
import { JdpiFormatQrCode, JdpiErrorTypes } from '@zro/jdpi/domain';
import {
  CreateQrCodeStaticPixPaymentPspRequest,
  CreateQrCodeStaticPixPaymentPspResponse,
  PixPaymentGateway,
  PixPaymentPspException,
  OfflinePixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
} from '@zro/jdpi/infrastructure';

interface JdpiCreateQrCodeStaticPixPaymentRequest {
  formato: number;
  chave: string;
  codigoCategoria?: string;
  valor?: number;
  nomeRecebedor: string;
  cidade: string;
  cep?: string;
  idConciliacaoRecebedor?: string;
  dadosAdicionais?: string;
  ispbFss?: number;
}

interface JdpiCreateQrCodeStaticPixPaymentResponse {
  imagemQrCodeInBase64?: string;
  payloadBase64?: string;
}

export class JdpiCreateQrCodeStaticPixPaymentPspGateway
  implements Pick<PixPaymentGateway, 'createQrCodeStatic'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: JdpiCreateQrCodeStaticPixPaymentPspGateway.name,
    });
  }

  async createQrCodeStatic(
    request: CreateQrCodeStaticPixPaymentPspRequest,
  ): Promise<CreateQrCodeStaticPixPaymentPspResponse> {
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiCreateQrCodeStaticPixPaymentRequest = {
      formato: JdpiFormatQrCode.PAYLOAD,
      chave: Sanitize.key(request.key, request.keyType),
      idConciliacaoRecebedor: Sanitize.txId(request.txId, 25),
      nomeRecebedor: Sanitize.fullName(request.recipientName, 25),
      cidade: Sanitize.fullName(request.recipientCity, 15),
      ...(request.documentValue && {
        valor: Sanitize.parseValue(request.documentValue),
      }),
      ...(isDefined(request.ispbWithdrawal) && {
        ispbFss: Sanitize.parseIspb(request.ispbWithdrawal),
      }),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response =
        await this.axios.post<JdpiCreateQrCodeStaticPixPaymentResponse>(
          JDPI_SERVICES.PIX_PAYMENT.QR_CODE_STATIC,
          payload,
          { headers },
        );

      this.logger.info('Response found.', { data: response.data });

      return {
        emv: Sanitize.decodeBase64(response.data.payloadBase64),
      };
    } catch (error) {
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
