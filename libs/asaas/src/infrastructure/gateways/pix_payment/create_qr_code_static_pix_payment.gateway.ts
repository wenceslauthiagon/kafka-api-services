import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { MissingDataException } from '@zro/common';
import {
  CreateQrCodePixPaymentPspRequest,
  CreateQrCodePixPaymentPspResponse,
  PixKeyNotFoundPspException,
  PixPaymentGateway,
  PixPaymentPspException,
} from '@zro/pix-zro-pay/application';
import { QrCodeFormat } from '@zro/pix-zro-pay/domain';
import { Sanitize, ASAAS_SERVICES } from '@zro/asaas/infrastructure';

interface AsaasCreateQrCodeStaticPixPaymentRequest {
  addressKey: string;
  expirationSeconds: number;
  format: QrCodeFormat;
  description?: string;
  allowsMultiplePayments?: boolean;
  permittedPayerDocument?: number;
  value?: number;
}

export interface AsaasCreateQrCodeStaticPixPaymentResponse {
  id: string;
  payload: string;
  expirationDate: string;
}

export class AsaasCreateQrCodeStaticPixPaymentPspGateway
  implements Pick<PixPaymentGateway, 'createQrCode'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: AsaasCreateQrCodeStaticPixPaymentPspGateway.name,
    });
  }

  async createQrCode(
    request: CreateQrCodePixPaymentPspRequest,
  ): Promise<CreateQrCodePixPaymentPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: AsaasCreateQrCodeStaticPixPaymentRequest = {
      addressKey: request.bankAccount.pixKey,
      expirationSeconds: request.expirationSeconds,
      allowsMultiplePayments: request.allowsMultiplePayments ?? false,
      format: request.format,
      ...(request.payerDocument && {
        permittedPayerDocument: request.payerDocument,
      }),
      ...(request.description && {
        description: Sanitize.description(request.description),
      }),
      ...(request.value && {
        value: Sanitize.toValue(request.value),
      }),
    };

    this.logger.debug('Request payload.', { payload });

    try {
      const response =
        await this.axios.post<AsaasCreateQrCodeStaticPixPaymentResponse>(
          ASAAS_SERVICES.PIX_PAYMENT.QR_CODE_STATIC,
          payload,
        );

      this.logger.debug('Response found.', { data: response.data });

      return {
        txId: response.data.id,
        emv: response.data.payload,
        expirationDate: response.data.expirationDate,
      };
    } catch (error) {
      const parseMessage = (message: string) => {
        if (!message) return;

        if (message.startsWith('Chave Pix não encontrada.')) {
          throw new PixKeyNotFoundPspException(error);
        }
      };

      if (Array.isArray(error.response?.data?.errors)) {
        this.logger.error('ERROR Asaas response data.', {
          error: error.response.data.errors,
        });

        error.response?.data?.errors.map((error) => {
          const { description } = error;
          parseMessage(description);
        });
      }

      this.logger.error('Unexpected Asaas gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new PixPaymentPspException(error);
    }
  }
}
