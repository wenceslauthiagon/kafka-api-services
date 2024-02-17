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
  GENIAL_SERVICES,
  GenialAuthGateway,
} from '@zro/genial/infrastructure';

type TAddressingKey = {
  key: string;
  type: string;
};

type TAdditionalInformation = {
  name: string;
  content: string;
  showToPayer: boolean;
};

type TPayer = {
  payerName: string;
  cpfCnpj: number;
};

type TReceiver = {
  name: string;
  cpfCnpj: string;
  tradeName: string;
  agency: string;
  account: string;
};

interface GenialCreateQrCodePixPaymentRequest {
  addressingKey: TAddressingKey;
  accountHolderName: string;
  accountHolderCity: string;
  value: number;
  expiration: number;
  daysAfterVenc?: number;
  finePercentual?: number;
  modalityChange?: number;
  additionalInformation: TAdditionalInformation[];
  payer: TPayer;
  receiver: TReceiver;
  receiverTxId: string;
}

interface IGenialCreateQrCodePixPaymentResponseItem {
  data: {
    textContent: string;
    reference: string;
  };
}

export interface GenialCreateQrCodePixPaymentResponse {
  data: { items: IGenialCreateQrCodePixPaymentResponseItem[] };
}

export class GenialCreateQrCodePixPaymentPspGateway
  implements Pick<PixPaymentGateway, 'createQrCode'>
{
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
    private qrCodeAccountHolderName: string,
    private qrCodeAccountHolderCity: string,
    private qrCodeCpnjZro: string,
  ) {
    this.logger = logger.child({
      context: GenialCreateQrCodePixPaymentPspGateway.name,
    });
  }

  async createQrCode(
    request: CreateQrCodePixPaymentPspRequest,
  ): Promise<CreateQrCodePixPaymentPspResponse> {
    // Data input check
    if (!request) {
      throw new MissingDataException(['Message']);
    }

    const payload: GenialCreateQrCodePixPaymentRequest = {
      addressingKey: {
        key: request.bankAccount.pixKey,
        type: request.bankAccount.pixKeyType,
      },
      accountHolderName: this.qrCodeAccountHolderName,
      accountHolderCity: this.qrCodeAccountHolderCity,
      value: Sanitize.toValue(request.value),
      expiration: request.expirationSeconds,
      daysAfterVenc: request.daysAfterVenc || 0,
      finePercentual: request.finePercentual || 0,
      modalityChange: request.modalityChange || 0,
      additionalInformation: [
        {
          name: this.qrCodeAccountHolderName,
          ...(request.description && {
            content: Sanitize.description(request.description),
          }),
          showToPayer: request.company.showQrCodeInfoToPayer,
        },
      ],
      ...(request.payerDocument && {
        payer: {
          ...(request.payerName && {
            payerName: request.payerName,
          }),
          cpfCnpj: request.payerDocument,
        },
      }),
      receiver: {
        name: this.qrCodeAccountHolderName,
        cpfCnpj: this.qrCodeCpnjZro,
        tradeName: this.qrCodeAccountHolderName,
        agency: request.bankAccount.agency,
        account: request.bankAccount.accountNumber,
      },
      receiverTxId: Sanitize.txId(uuidV4()),
    };

    const headers = {
      Authorization: await GenialAuthGateway.getAccessToken(this.logger),
    };

    this.logger.debug('Request payload.', { payload });

    try {
      const response =
        await this.axios.post<GenialCreateQrCodePixPaymentResponse>(
          GENIAL_SERVICES.PIX_PAYMENT.QR_CODE,
          payload,
          { headers },
        );

      this.logger.debug('Response found.', { data: response.data });

      if (!response.data?.data?.items?.length) return;

      const expirationDate = getMoment()
        .add(payload.expiration, 's')
        .format('YYYY-MM-DD HH:mm:ss');

      // Just first item
      const [result] = response.data.data.items;

      return {
        txId: result.data.reference,
        emv: result.data.textContent,
        expirationDate,
      };
    } catch (error) {
      this.logger.error('Unexpected Genial gateway error', {
        error: error.isAxiosError ? error.message : error,
        request: error.config,
        response: error.response?.data ?? error.response ?? error,
      });
      throw new PixPaymentPspException(error);
    }
  }
}
