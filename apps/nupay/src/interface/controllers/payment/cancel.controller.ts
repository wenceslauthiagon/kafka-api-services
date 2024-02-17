import { AutoValidator } from '@zro/common';
import { CancelPaymentUseCase, IPaymentService } from '@zro/nupay/application';
import { Checkout, CheckoutRepository } from '@zro/nupay/domain';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { Logger } from 'winston';

export type TCancelPaymentRequest = {
  checkoutId: string;
};

export class CancelPaymentRequest
  extends AutoValidator
  implements TCancelPaymentRequest
{
  @IsUUID(4)
  checkoutId: string;

  constructor(props: TCancelPaymentRequest) {
    super(props);
  }
}

type TCancelPaymentResponse = Pick<
  Checkout,
  | 'id'
  | 'status'
  | 'referenceId'
  | 'authorizationId'
  | 'destination'
  | 'requesterName'
  | 'requesterDocument'
  | 'requesterContact'
  | 'currency'
  | 'amount'
  | 'updatedAt'
  | 'createdAt'
  | 'expiresAt'
>;

export class CancelPaymentResponse
  extends AutoValidator
  implements TCancelPaymentResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  referenceId?: string;

  @IsString()
  @IsOptional()
  authorizationId?: string;

  @IsString()
  destination: string;

  @IsString()
  requesterName: string;

  @IsString()
  requesterDocument: string;

  @IsString()
  requesterContact: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  @IsDate()
  expiresAt: Date;
  constructor(props: TCancelPaymentResponse) {
    super(props);
  }
}

export class CancelPaymentController {
  private usecase: CancelPaymentUseCase;

  constructor(
    private logger: Logger,
    service: IPaymentService,
    checkoutRepository: CheckoutRepository,
  ) {
    this.logger = logger.child({
      context: CancelPaymentController.name,
    });

    this.usecase = new CancelPaymentUseCase(
      logger,
      service,
      checkoutRepository,
    );
  }

  async execute(checkoutId: string): Promise<CancelPaymentResponse> {
    this.logger.debug('Cancel NyPay payment.', { checkoutId });

    const payment = await this.usecase.execute(checkoutId);

    if (!payment) return null;

    const response = new CancelPaymentResponse({
      id: payment.id,
      status: payment.status,
      referenceId: payment.referenceId,
      authorizationId: payment.authorizationId,
      destination: payment.destination,
      requesterName: payment.requesterName,
      requesterDocument: payment.requesterDocument,
      requesterContact: payment.requesterContact,
      currency: payment.currency,
      amount: payment.amount,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      expiresAt: payment.expiresAt,
    });

    this.logger.info('Cancel NyPay payment response.', {
      payment: response,
    });

    return response;
  }
}
