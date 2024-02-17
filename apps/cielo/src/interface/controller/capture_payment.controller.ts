import { Logger } from 'winston';
import { CapturePaymentUseCase, ICieloService } from '@zro/cielo/application';
import { CheckoutRepository } from '@zro/cielo/domain';
import { CheckoutHistoricDatabaseRepository } from '@zro/cielo/infrastructure';
import { AutoValidator } from '@zro/common';
import { IsEnum, IsString, IsUUID } from 'class-validator';

export enum CieloWebhookStatusEnum {
  status_changed = 1,
  recurrence_created = 2,
  anti_fraud_changed = 3,
  recurrence_desactivated = 4,
  refunded = 5,
  ticket = 6,
  chargeback = 7,
  anti_fraud_alert = 8,
}

export type TCapturePaymentRequest = {
  ReferenceId: string;
  ChangeType: CieloWebhookStatusEnum;
};

export class CapturePaymentRequest
  extends AutoValidator
  implements TCapturePaymentRequest
{
  @IsUUID(4)
  ReferenceId: string;

  @IsEnum(CieloWebhookStatusEnum)
  ChangeType: CieloWebhookStatusEnum;

  constructor(props: CapturePaymentRequest) {
    super(props);
  }
}

export type TCapturePaymentResponse = {
  CheckoutId: string;
  Status: string;
};

export class CapturePaymentResponse
  extends AutoValidator
  implements TCapturePaymentResponse
{
  @IsUUID(4)
  CheckoutId: string;

  @IsString()
  Status: string;

  constructor(props: TCapturePaymentResponse) {
    super(props);
  }
}

export class CapturePaymentController {
  private usecase: CapturePaymentUseCase;

  constructor(
    private logger: Logger,
    checkoutRepository: CheckoutRepository,
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    cieloService: ICieloService,
  ) {
    this.logger = logger.child({
      context: CapturePaymentController.name,
    });

    this.usecase = new CapturePaymentUseCase(
      logger,
      checkoutRepository,
      checkoutHistoricRepository,
      cieloService,
    );
  }

  async execute(
    request: CapturePaymentRequest,
  ): Promise<CapturePaymentResponse> {
    this.logger.debug('Capture Cielo Payment.', { request });

    const payment = await this.usecase.execute(request);

    if (!payment) return null;

    this.logger.info('Capture Cielo payment response.', {
      payment,
    });

    return payment;
  }
}
