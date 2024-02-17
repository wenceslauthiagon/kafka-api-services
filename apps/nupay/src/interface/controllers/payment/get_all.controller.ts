import { AutoValidator } from '@zro/common';
import { GetAllPaymentUseCase } from '@zro/nupay/application';
import { Checkout, CheckoutRepository } from '@zro/nupay/domain';
import {
  IsArray,
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { Logger } from 'winston';

type TGetAllPaymentResponseItem = Pick<
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

export class GetAllPaymentResponseItem
  extends AutoValidator
  implements TGetAllPaymentResponseItem
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
  constructor(props: TGetAllPaymentResponseItem) {
    super(props);
  }
}

export type TGetAllPaymentResponse = {
  payments: TGetAllPaymentResponseItem[];
};

export class GetAllPaymentResponse
  extends AutoValidator
  implements TGetAllPaymentResponse
{
  @IsArray()
  payments: GetAllPaymentResponseItem[];

  constructor(props: TGetAllPaymentResponse) {
    super(props);
  }
}

export class GetAllPaymentController {
  private usecase: GetAllPaymentUseCase;

  constructor(
    private logger: Logger,
    checkoutRepository: CheckoutRepository,
  ) {
    this.logger = logger.child({
      context: GetAllPaymentController.name,
    });

    this.usecase = new GetAllPaymentUseCase(logger, checkoutRepository);
  }

  async execute(): Promise<GetAllPaymentResponse> {
    this.logger.debug('Get all payments.');

    const result = await this.usecase.execute();

    if (!result) return null;

    const response = new GetAllPaymentResponse({
      payments: result.payments,
    });

    this.logger.info('Get payment status response.', {
      length: response.payments.length,
    });

    return response;
  }
}
