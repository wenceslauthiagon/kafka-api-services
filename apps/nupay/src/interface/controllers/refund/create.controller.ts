import { AutoValidator } from '@zro/common';
import {
  Checkout,
  CheckoutHistoricRepository,
  CheckoutRepository,
} from '@zro/nupay/domain';
import { CreateRefundUseCase, IRefundService } from '@zro/nupay/application';

import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { Logger } from 'winston';

export type TCreateRefundRequest = {
  checkoutId: string;
  amount: number;
  notes?: string;
};

export class CreateRefundRequest
  extends AutoValidator
  implements TCreateRefundRequest
{
  @IsUUID(4)
  checkoutId: string;

  @IsNumber()
  amount: number;

  @IsString()
  notes?: string;

  constructor(props: TCreateRefundRequest) {
    super(props);
  }
}

type TCreateRefundResponse = Pick<
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

export class CreateRefundResponse
  extends AutoValidator
  implements TCreateRefundResponse
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
  constructor(props: TCreateRefundResponse) {
    super(props);
  }
}

export class CreateRefundController {
  private usecase: CreateRefundUseCase;

  constructor(
    private logger: Logger,
    service: IRefundService,
    checkoutRepository: CheckoutRepository,
    checkoutHistoricRepository: CheckoutHistoricRepository,
  ) {
    this.logger = logger.child({
      context: CreateRefundController.name,
    });

    this.usecase = new CreateRefundUseCase(
      logger,
      service,
      checkoutRepository,
      checkoutHistoricRepository,
    );
  }

  async execute(request: CreateRefundRequest): Promise<CreateRefundResponse> {
    this.logger.debug('Create NyPay refund.', { request });

    const payment = await this.usecase.execute(request);

    if (!payment) return null;

    const response = new CreateRefundResponse({
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

    this.logger.info('Create NyPay refund response.', {
      refund: response,
    });

    return response;
  }
}
