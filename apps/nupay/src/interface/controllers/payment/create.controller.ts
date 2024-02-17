import { AutoValidator } from '@zro/common';
import { CheckoutHistoricRepository } from '@zro/nupay/domain';
import { CreatePaymentUseCase, IPaymentService } from '@zro/nupay/application';
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

export type TCreatePaymentRequest = {
  checkoutId: string;
};

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

type TCreatePaymentResponse = Pick<
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

export class CreatePaymentResponse
  extends AutoValidator
  implements TCreatePaymentResponse
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
  constructor(props: TCreatePaymentResponse) {
    super(props);
  }
}
export class CreatePaymentController {
  private usecase: CreatePaymentUseCase;

  constructor(
    private logger: Logger,
    service: IPaymentService,
    checkoutRepository: CheckoutRepository,
    checkoutHistoricRepository: CheckoutHistoricRepository,
  ) {
    this.logger = logger.child({
      context: CreatePaymentController.name,
    });

    this.usecase = new CreatePaymentUseCase(
      logger,
      service,
      checkoutRepository,
      checkoutHistoricRepository,
    );
  }

  async execute(checkoutId: string): Promise<CreatePaymentResponse> {
    this.logger.debug('Create NyPay payment.', { checkoutId });

    const payment = await this.usecase.execute(checkoutId);

    if (!payment) return null;

    const response = new CreatePaymentResponse({
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

    this.logger.info('Create NyPay payment response.', {
      payment: response,
    });

    return response;
  }
}
