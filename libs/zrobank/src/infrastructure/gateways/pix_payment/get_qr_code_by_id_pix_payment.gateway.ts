import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { MissingDataException, getMoment } from '@zro/common';
import {
  GetQrCodeByIdPixPaymentPspRequest,
  GetQrCodeByIdPixPaymentPspResponse,
  PixPaymentGateway,
  PixPaymentPspException,
} from '@zro/pix-zro-pay/application';
import {
  ZROBANK_SERVICES,
  ZroBankAuthGateway,
} from '@zro/zrobank/infrastructure';

enum QrCodeState {
  PENDING = 'PENDING',
  READY = 'READY',
  ERROR = 'ERROR',
}

interface ZroBankGetQrCodeByIdPixPaymentRequest {
  id: string;
}

interface ZroBankGetQrCodeByIdPixPaymentResponse {
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

export class ZroBankGetQrCodeByIdPixPaymentPspGateway
  implements Pick<PixPaymentGateway, 'getQrCodeById'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: ZroBankGetQrCodeByIdPixPaymentPspGateway.name,
    });
  }

  async getQrCodeById(
    request: GetQrCodeByIdPixPaymentPspRequest,
  ): Promise<GetQrCodeByIdPixPaymentPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const params: ZroBankGetQrCodeByIdPixPaymentRequest = {
      id: request.id,
    };

    const accessToken = await ZroBankAuthGateway.getAccessToken(this.logger);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'x-transaction-id': uuidV4(),
      nonce: uuidV4(),
    };

    this.logger.debug('Request params.', { params });

    try {
      const response =
        await this.axios.get<ZroBankGetQrCodeByIdPixPaymentResponse>(
          `${ZROBANK_SERVICES.PIX_PAYMENT.GET_QR_CODE}/${params.id}`,
          { headers },
        );

      this.logger.debug('Response found.', { data: response.data });

      if (!response.data?.data) return;

      const { data: result } = response.data;

      return {
        txId: result.txid,
        emv: result.emv,
        expirationDate: getMoment(result.expiration_date).format(
          'YYYY-MM-DD HH:mm:ss',
        ),
        state: result.state,
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
