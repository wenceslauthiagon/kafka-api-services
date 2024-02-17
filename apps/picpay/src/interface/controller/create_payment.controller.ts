import { Logger } from 'winston';
import { AutoValidator } from '@zro/common';
import {
  CreatePaymentUseCase,
  IPaymentsService,
} from '@zro/picpay/application';
import {
  CreatePayment,
  Qrcode,
  CheckoutRepository,
  CheckoutHistoricRepository,
} from '@zro/picpay/domain';
import { IsObject, IsString, IsUUID } from 'class-validator';

export type TCreatePaymentRequest = Pick<CreatePayment, 'checkoutId'>;

export class CreatePaymentRequest
  extends AutoValidator
  implements TCreatePaymentRequest
{
  @IsUUID(4)
  checkoutId: string;

  constructor(props: TCreatePaymentRequest) {
    super(props);
  }
}

type TCreatePaymentResponse = {
  referenceId: string;
  paymentUrl: string;
  expiresAt: Date;
  qrcode: Qrcode;
};

export class CreatePaymentResponse
  extends AutoValidator
  implements TCreatePaymentResponse
{
  @IsUUID(4)
  referenceId: string;

  @IsString()
  paymentUrl: string;

  @IsString()
  expiresAt: Date;

  @IsObject()
  qrcode: Qrcode;

  constructor(props: TCreatePaymentResponse) {
    super(props);
  }
}

export class CreatePaymentController {
  private usecase: CreatePaymentUseCase;

  constructor(
    private logger: Logger,
    service: IPaymentsService,
    checkoutRepository: CheckoutRepository,
    checkoutHistoricRepository: CheckoutHistoricRepository,
    picpayChannel: string,
    picpayPurchaseMode: string,
    picpaySoftDescriptor: string,
  ) {
    this.logger = logger.child({
      context: CreatePaymentController.name,
    });

    this.usecase = new CreatePaymentUseCase(
      logger,
      service,
      checkoutRepository,
      checkoutHistoricRepository,
      picpayChannel,
      picpayPurchaseMode,
      picpaySoftDescriptor,
    );
  }

  async execute(checkoutId: string): Promise<CreatePaymentResponse> {
    this.logger.debug('Create PicPay payment.', { checkoutId });

    const payment = await this.usecase.execute(checkoutId);

    if (!payment) return null;

    const response = new CreatePaymentResponse({
      referenceId: payment.referenceId,
      paymentUrl: payment.paymentUrl,
      expiresAt: payment.expiresAt,
      qrcode: payment.qrcode,
    });

    this.logger.info('Create PicPay payment response.', {
      payment: response,
    });

    return response;
  }
}
