import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  CreateQrCodePixPaymentPspRequest,
  CreateQrCodePixPaymentPspResponse,
  PixPaymentGateway,
} from '@zro/pix-zro-pay/application';
import { AsaasCreateQrCodeStaticPixPaymentPspGateway } from '@zro/asaas';
import { BankAccountName } from '@zro/pix-zro-pay/domain';

export class AsaasPixPaymentGateway
  implements Omit<PixPaymentGateway, 'getQrCodeById'>
{
  constructor(
    private logger: Logger,
    private asaasPixPayment: AxiosInstance,
  ) {
    this.logger = logger.child({ context: AsaasPixPaymentGateway.name });
  }

  getProviderName(): string {
    return BankAccountName.BANK_ASAAS;
  }

  async createQrCode(
    request: CreateQrCodePixPaymentPspRequest,
  ): Promise<CreateQrCodePixPaymentPspResponse> {
    this.logger.debug('Create qrCodeStatic request.', { request });

    const gateway = new AsaasCreateQrCodeStaticPixPaymentPspGateway(
      this.logger,
      this.asaasPixPayment,
    );

    return gateway.createQrCode(request);
  }
}
