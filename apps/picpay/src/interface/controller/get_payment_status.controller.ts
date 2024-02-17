import { Logger } from 'winston';
import { AutoValidator } from '@zro/common';
import { GetPaymentStatusUseCase } from '@zro/picpay/application';
import {
  Checkout,
  CheckoutHistoricRepository,
  CheckoutRepository,
} from '@zro/picpay/domain';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export type TGetPaymentStatusRequest = {
  checkoutId: string;
};

export class GetPaymentStatusRequest
  extends AutoValidator
  implements TGetPaymentStatusRequest
{
  @IsString()
  checkoutId: string;
  constructor(props: TGetPaymentStatusRequest) {
    super(props);
  }
}

type TGetPaymentStatusResponse = Pick<
  Checkout,
  | 'id'
  | 'status'
  | 'referenceId'
  | 'authorizationId'
  | 'destination'
  | 'requesterName'
  | 'requesterDocument'
  | 'requesterContact'
  | 'payload'
  | 'amount'
  | 'createdAt'
  | 'expiresAt'
>;

export class GetPaymentStatusResponse
  extends AutoValidator
  implements TGetPaymentStatusResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  status: string;

  @IsString()
  referenceId: string;

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
  payload?: string;

  @IsNumber()
  amount: number;

  @IsDate()
  createdAt: Date;
  @IsDate()
  expiresAt: Date;
  constructor(props: TGetPaymentStatusResponse) {
    super(props);
  }
}

export class GetPaymentStatusController {
  private usecase: GetPaymentStatusUseCase;

  constructor(
    private logger: Logger,
    checkoutRepository: CheckoutRepository,
    checkoutHistoricRepository: CheckoutHistoricRepository,
  ) {
    this.logger = logger.child({
      context: GetPaymentStatusController.name,
    });

    this.usecase = new GetPaymentStatusUseCase(
      logger,
      checkoutRepository,
      checkoutHistoricRepository,
    );
  }

  async execute(referenceId: string): Promise<GetPaymentStatusResponse> {
    this.logger.debug('Get payment status with referenceId.', { referenceId });

    const payment = await this.usecase.execute(referenceId);

    if (!payment) return null;

    const response = new GetPaymentStatusResponse({
      id: payment.id,
      status: payment.status,
      referenceId: payment.referenceId,
      authorizationId: payment.authorizationId,
      destination: payment.destination,
      requesterName: payment.requesterName,
      requesterDocument: payment.requesterDocument,
      requesterContact: payment.requesterContact,
      payload: payment.payload,
      amount: payment.amount,
      createdAt: payment.createdAt,
      expiresAt: payment.expiresAt,
    });

    this.logger.info('Get payment status response.', {
      payment: response,
    });

    return response;
  }
}
