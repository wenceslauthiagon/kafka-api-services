import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { MissingDataException } from '@zro/common';
import { PixDevolutionCode } from '@zro/pix-payments/domain';
import {
  CreatePixDevolutionRefundPixPaymentPspRequest,
  CreatePixDevolutionRefundPixPaymentPspResponse,
  OfflinePixPaymentPspException,
  PixPaymentGateway,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  JDPI_SERVICES,
  Sanitize,
} from '@zro/jdpi/infrastructure';
import { JdpiErrorTypes } from '@zro/jdpi/domain';

interface JdpiCreatePixDevolutionRefundPixPaymentRequest {
  idReqSistemaCliente: string;
  endToEndIdOriginal: string;
  endToEndIdDevolucao?: string;
  valorDevolucao: number;
  codigoDevolucao: PixDevolutionCode;
  motivoDevolucao?: string;
  infEntreClientes?: string;
}

interface JdpiCreatePixDevolutionRefundPixPaymentResponse {
  idReqSistemaCliente: string;
  idReqJdPi: string;
  endToEndIdOriginal: string;
  endToEndIdDevolucao: string;
  dtHrReqJdPi: Date;
}

export class JdpiCreatePixDevolutionRefundPixPaymentPspGateway
  implements Pick<PixPaymentGateway, 'createPixDevolutionRefund'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: JdpiCreatePixDevolutionRefundPixPaymentPspGateway.name,
    });
  }

  async createPixDevolutionRefund(
    request: CreatePixDevolutionRefundPixPaymentPspRequest,
  ): Promise<CreatePixDevolutionRefundPixPaymentPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiCreatePixDevolutionRefundPixPaymentRequest = {
      idReqSistemaCliente: request.devolutionId,
      endToEndIdOriginal: request.depositEndToEndId,
      valorDevolucao: Sanitize.parseValue(request.amount),
      codigoDevolucao: request.devolutionCode,
      ...(request.description && { motivoDevolucao: request.description }),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': request.devolutionId,
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response =
        await this.axios.post<JdpiCreatePixDevolutionRefundPixPaymentResponse>(
          JDPI_SERVICES.PIX_PAYMENT.DEVOLUTION,
          payload,
          { headers },
        );

      this.logger.info('Response found.', { data: response.data });

      return {
        externalId: response.data.idReqJdPi,
        endToEndId: response.data.endToEndIdDevolucao,
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
