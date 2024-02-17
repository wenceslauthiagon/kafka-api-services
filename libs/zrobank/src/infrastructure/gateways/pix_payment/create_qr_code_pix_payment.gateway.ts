import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { MissingDataException, getMoment } from '@zro/common';
import {
  CreateQrCodePixPaymentPspRequest,
  CreateQrCodePixPaymentPspResponse,
  PixPaymentGateway,
  PixPaymentPspException,
} from '@zro/pix-zro-pay/application';
import {
  Sanitize,
  ZROBANK_SERVICES,
  ZroBankAuthGateway,
} from '@zro/zrobank/infrastructure';

enum QrCodeState {
  PENDING = 'PENDING',
  READY = 'READY',
  ERROR = 'ERROR',
}

interface ZroBankCreateQrCodePixPaymentRequest {
  key: string;
  document_value: number;
  expiration_date: string;
  description: string;
}

export interface ZroBankCreateQrCodePixPaymentResponse {
  data: {
    id: string;
    txid: string;
    emv: string;
    key_id: string;
    state: QrCodeState;
    description: string;
    expiration_date: Date;
  };
}

export class ZroBankCreateQrCodePixPaymentPspGateway
  implements Pick<PixPaymentGateway, 'createQrCode'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: ZroBankCreateQrCodePixPaymentPspGateway.name,
    });
  }

  async createQrCode(
    request: CreateQrCodePixPaymentPspRequest,
  ): Promise<CreateQrCodePixPaymentPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: ZroBankCreateQrCodePixPaymentRequest = {
      key: request.bankAccount.pixKey,
      document_value: request.value,
      expiration_date: getMoment()
        .add(request.expirationSeconds)
        .format('YYYY-MM-DD'),
      description: Sanitize.description(request.description),
    };

    const accessToken = await ZroBankAuthGateway.getAccessToken(this.logger);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'x-transaction-id': uuidV4(),
      nonce: uuidV4(),
    };

    this.logger.debug('Request payload.', { payload });

    try {
      const response =
        await this.axios.post<ZroBankCreateQrCodePixPaymentResponse>(
          ZROBANK_SERVICES.PIX_PAYMENT.CREATE_QR_CODE,
          payload,
          { headers },
        );

      this.logger.debug('Response found.', { data: response.data });

      if (!response.data?.data) return;

      const { data: result } = response.data;

      return {
        id: result.id,
        txId: result.txid,
        emv: result.emv,
        expirationDate: getMoment(result.expiration_date).format(
          'YYYY-MM-DD HH:mm:ss',
        ),
      };
    } catch (error) {
      this.logger.error('Unexpected ZroBank gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new PixPaymentPspException(error);
    }
  }
}
