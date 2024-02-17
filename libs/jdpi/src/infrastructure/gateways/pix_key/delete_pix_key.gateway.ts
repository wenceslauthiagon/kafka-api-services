import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { JdpiErrorTypes, JdpiReasonType } from '@zro/jdpi/domain';
import {
  OfflinePixKeyPspException,
  PixKeyPspException,
  PixKeyGateway,
  DeletePixKeyPspRequest,
  DeletePixKeyPspResponse,
} from '@zro/pix-keys/application';
import {
  JdpiAuthGateway,
  Sanitize,
  JDPI_SERVICES,
} from '@zro/jdpi/infrastructure';

export interface JdpiDeletePixKeyRequest {
  chave: string;
  ispb: number;
  motivo: JdpiReasonType;
}

interface JdpiDeletePixKeyResponse {
  chave: string;
}

export class JdpiDeletePixKeyPspGateway
  implements Pick<PixKeyGateway, 'deletePixKey'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({ context: JdpiDeletePixKeyPspGateway.name });
  }

  async deletePixKey(
    request: DeletePixKeyPspRequest,
  ): Promise<DeletePixKeyPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: JdpiDeletePixKeyRequest = {
      chave: Sanitize.key(request.key, request.keyType),
      ispb: Sanitize.parseIspb(request.ispb),
      motivo: Sanitize.parseReason(request.reason),
    };

    const headers = {
      Authorization: await JdpiAuthGateway.getAccessToken(this.logger),
      'Chave-Idempotencia': request.pixKeyId,
    };

    this.logger.info('Request payload.', { payload });

    try {
      const response = await this.axios.post<JdpiDeletePixKeyResponse>(
        JDPI_SERVICES.PIX_KEY.DELETE(payload.chave),
        payload,
        { headers },
      );

      this.logger.info('Response found.', { data: response.data });

      return {
        key: response.data.chave,
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
