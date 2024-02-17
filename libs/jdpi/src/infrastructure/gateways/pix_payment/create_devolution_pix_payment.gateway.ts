import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { MissingDataException } from '@zro/common';
import { JdpiErrorTypes } from '@zro/jdpi/domain';
import { PixDevolutionCode } from '@zro/pix-payments/domain';
import {
  CreatePixDevolutionPixPaymentPspRequest,
  CreatePixDevolutionPixPaymentPspResponse,
  OfflinePixPaymentPspException,
  PixPaymentGateway,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
} from '@zro/jdpi/infrastructure';

export interface JdpiCreatePixDevolutionPixPaymentRequest {
  idReqSistemaCliente: string;
  endToEndIdOriginal: string;
  endToEndIdDevolucao?: string;
  valorDevolucao: number;
  codigoDevolucao: PixDevolutionCode;
  motivoDevolucao?: string;
  infEntreClientes?: string;
}

export interface JdpiCreatePixDevolutionPixPaymentResponse {
  idReqSistemaCliente: string;
  idReqJdPi: string;
  endToEndIdOriginal: string;
  endToEndIdDevolucao: string;
  dtHrReqJdPi: Date;
}

export class JdpiCreatePixDevolutionPixPaymentPspGateway
  implements Pick<PixPaymentGateway, 'createPixDevolution'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: JdpiCreatePixDevolutionPixPaymentPspGateway.name,
    });
  }

  async createPixDevolution(
    request: CreatePixDevolutionPixPaymentPspRequest,
  ): Promise<CreatePixDevolutionPixPaymentPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiCreatePixDevolutionPixPaymentRequest = {
      idReqSistemaCliente: request.devolutionId,
      endToEndIdOriginal: request.depositEndToEndId,
      valorDevolucao: Sanitize.parseValue(request.amount),
      codigoDevolucao: request.devolutionCode,
      ...(request.description && {
        infEntreClientes: Sanitize.description(request.description),
      }),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': request.devolutionId,
    };

    this.logger.info('Request payload and headers.', {
      payload,
      headers: { 'Chave-Idempotencia': request.devolutionId },
    });

    try {
      const response =
        await this.axios.post<JdpiCreatePixDevolutionPixPaymentResponse>(
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
