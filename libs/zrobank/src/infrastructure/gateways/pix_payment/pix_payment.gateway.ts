import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  CreateQrCodePixPaymentPspRequest,
  CreateQrCodePixPaymentPspResponse,
  GetQrCodeByIdPixPaymentPspRequest,
  GetQrCodeByIdPixPaymentPspResponse,
  PixPaymentGateway,
} from '@zro/pix-zro-pay/application';
import {
  ZroBankCreateQrCodePixPaymentPspGateway,
  ZroBankGetQrCodeByIdPixPaymentPspGateway,
} from '@zro/zrobank';
import { BankAccountName } from '@zro/pix-zro-pay/domain';

export class ZroBankPixPaymentGateway implements PixPaymentGateway {
  constructor(
    private logger: Logger,
    private zrobankPixPayment: AxiosInstance,
  ) {
    this.logger = logger.child({ context: ZroBankPixPaymentGateway.name });
  }

  getProviderName(): string {
    return BankAccountName.BANK_ZRO_BANK;
  }

  async createQrCode(
    request: CreateQrCodePixPaymentPspRequest,
  ): Promise<CreateQrCodePixPaymentPspResponse> {
    this.logger.debug('Create qrCode request.', { request });

    const gateway = new ZroBankCreateQrCodePixPaymentPspGateway(
      this.logger,
      this.zrobankPixPayment,
    );

    return gateway.createQrCode(request);
  }

  async getQrCodeById(
    request: GetQrCodeByIdPixPaymentPspRequest,
  ): Promise<GetQrCodeByIdPixPaymentPspResponse> {
    this.logger.debug('Get qrCodByIde request.', { request });

    const gateway = new ZroBankGetQrCodeByIdPixPaymentPspGateway(
      this.logger,
      this.zrobankPixPayment,
    );

    return gateway.getQrCodeById(request);
  }
}
