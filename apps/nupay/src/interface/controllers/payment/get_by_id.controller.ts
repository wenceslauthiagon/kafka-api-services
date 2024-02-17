import { AutoValidator } from '@zro/common';
import { GetByIdPaymentUseCase } from '@zro/nupay/application';
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

export type TGetByIdPaymentRequest = {
  checkoutId: string;
};

export class GetByIdPaymentRequest
  extends AutoValidator
  implements TGetByIdPaymentRequest
{
  @IsUUID(4)
  checkoutId: string;

  constructor(props: TGetByIdPaymentRequest) {
    super(props);
  }
}

type TGetByIdPaymentResponse = Pick<
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

export class GetByIdPaymentResponse
  extends AutoValidator
  implements TGetByIdPaymentResponse
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
  constructor(props: TGetByIdPaymentResponse) {
    super(props);
  }
}

export class GetByIdPaymentController {
  private usecase: GetByIdPaymentUseCase;

  constructor(
    private logger: Logger,
    checkoutRepository: CheckoutRepository,
  ) {
    this.logger = logger.child({
      context: GetByIdPaymentController.name,
    });

    this.usecase = new GetByIdPaymentUseCase(logger, checkoutRepository);
  }

  async execute(referenceId: string): Promise<GetByIdPaymentResponse> {
    this.logger.debug('Get payment status with referenceId.', { referenceId });

    const payment = await this.usecase.execute(referenceId);

    if (!payment) return null;

    const response = new GetByIdPaymentResponse({
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

    this.logger.info('Get payment status response.', {
      payment: response,
    });

    return response;
  }
}
