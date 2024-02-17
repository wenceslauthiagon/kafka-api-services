import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { isNumber } from 'class-validator';
import { MissingDataException } from '@zro/common';
import { JdpiErrorTypes } from '@zro/jdpi/domain';
import {
  OfflinePixPaymentPspException,
  PixPaymentGateway,
  PixPaymentPspException,
  UpdateQrCodeDynamicDueDatePixPaymentPspRequest,
  UpdateQrCodeDynamicDueDatePixPaymentPspResponse,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  JDPI_SERVICES,
  Sanitize,
  ZROBANK_OPEN_BANKING_SERVICES,
} from '@zro/jdpi/infrastructure';

interface JdpiUpdateQrCodeDynamicDueDatePixPaymentRequest {
  idDocumento: string;
  ispbCertificadoJws?: number;
  valorOriginal?: number;
  abatimento?: number;
  desconto?: number;
  juros?: number;
  multa?: number;
  valorFinal: number;
  urlJwk: string;
}

interface JdpiUpdateQrCodeDynamicDueDatePixPaymentResponse {
  payloadJws: string;
}

export class JdpiUpdateQrCodeDynamicDueDatePixPaymentGateway
  implements Pick<PixPaymentGateway, 'updateQrCodeDynamicDueDate'>
{
  constructor(
    private readonly logger: Logger,
    private readonly axios: AxiosInstance,
    private readonly pspIspb: number,
    private readonly pspOpenBankingBaseUrl: string,
  ) {
    this.logger = logger.child({
      context: JdpiUpdateQrCodeDynamicDueDatePixPaymentGateway.name,
    });
  }

  async updateQrCodeDynamicDueDate(
    request: UpdateQrCodeDynamicDueDatePixPaymentPspRequest,
  ): Promise<UpdateQrCodeDynamicDueDatePixPaymentPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiUpdateQrCodeDynamicDueDatePixPaymentRequest = {
      idDocumento: request.externalId,
      ispbCertificadoJws: this.pspIspb,
      ...(request.originalDocumentValue && {
        valorOriginal: Sanitize.parseValue(request.originalDocumentValue),
      }),
      ...(isNumber(request.rebateValue) && {
        abatimento: Sanitize.parseValue(request.rebateValue),
      }),
      ...(isNumber(request.discountValue) && {
        desconto: Sanitize.parseValue(request.discountValue),
      }),
      ...(isNumber(request.interestValue) && {
        juros: Sanitize.parseValue(request.interestValue),
      }),
      ...(isNumber(request.fineValue) && {
        multa: Sanitize.parseValue(request.fineValue),
      }),
      valorFinal: Sanitize.parseValue(request.finalDocumentValue),
      urlJwk: `${this.pspOpenBankingBaseUrl}/${ZROBANK_OPEN_BANKING_SERVICES.DYNAMIC_QR_CODE.GET_JWK}`,
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': request.externalId,
    };

    this.logger.info('Request payload and headers.', {
      payload,
      headers: { 'Chave-Idempotencia': request.externalId },
    });

    try {
      const response =
        await this.axios.post<JdpiUpdateQrCodeDynamicDueDatePixPaymentResponse>(
          JDPI_SERVICES.PIX_PAYMENT.QR_CODE_DYNAMIC_DUE_DATE.UPDATE,
          payload,
          { headers },
        );

      this.logger.info('Response found.', { data: response.data });

      return {
        payloadJws: response.data.payloadJws,
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
