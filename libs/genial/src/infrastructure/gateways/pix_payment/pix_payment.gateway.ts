import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  CreateQrCodePixPaymentPspRequest,
  CreateQrCodePixPaymentPspResponse,
  PixPaymentGateway,
} from '@zro/pix-zro-pay/application';
import { GenialCreateQrCodePixPaymentPspGateway } from '@zro/genial';
import { BankAccountName } from '@zro/pix-zro-pay/domain';

export class GenialPixPaymentGateway
  implements Omit<PixPaymentGateway, 'getQrCodeById'>
{
  constructor(
    private logger: Logger,
    private genialPixPayment: AxiosInstance,
    private qrCodeAccountHolderName: string,
    private qrCodeAccountHolderCity: string,
    private qrCodeCpnjZro: string,
  ) {
    this.logger = logger.child({ context: GenialPixPaymentGateway.name });
  }

  getProviderName(): string {
    return BankAccountName.BANK_GENIAL;
  }

  async createQrCode(
    request: CreateQrCodePixPaymentPspRequest,
  ): Promise<CreateQrCodePixPaymentPspResponse> {
    this.logger.debug('Create qrCode request.', { request });

    const gateway = new GenialCreateQrCodePixPaymentPspGateway(
      this.logger,
      this.genialPixPayment,
      this.qrCodeAccountHolderName,
      this.qrCodeAccountHolderCity,
      this.qrCodeCpnjZro,
    );

    return gateway.createQrCode(request);
  }
}
