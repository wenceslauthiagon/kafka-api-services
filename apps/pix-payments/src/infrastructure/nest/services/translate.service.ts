import {
  FailedEntity,
  TranslateService as NestTranslateService,
} from '@zro/common';
import { Payment } from '@zro/pix-payments/domain';
import { TranslateService } from '@zro/pix-payments/application';

const DEFAULT_GENERIC_ERROR_CODE = 'ED05';

export class TranslateI18nService implements TranslateService {
  constructor(private readonly translateService: NestTranslateService) {}

  async translatePixPaymentFailed(
    failedCode: string,
  ): Promise<Payment['failed']> {
    const code = failedCode ?? DEFAULT_GENERIC_ERROR_CODE;

    const message = await this.translateService.translate(
      'chargeback_exceptions',
      code,
    );

    return new FailedEntity({ code, message });
  }
}
