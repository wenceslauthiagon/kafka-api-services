import { Logger } from 'winston';
import { GetPaymentUseCase } from '@zro/cielo/application';
import { CheckoutRepository } from '@zro/cielo/domain';
import { CheckoutHistoricDatabaseRepository } from '@zro/cielo/infrastructure';
import { AutoValidator } from '@zro/common';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export type TGetPaymentRequest = {
  CheckoutId: string;
};

export class GetPaymentRequest
  extends AutoValidator
  implements TGetPaymentRequest
{
  @IsString()
  CheckoutId: string;

  constructor(props: GetPaymentRequest) {
    super(props);
  }
}

type TGetPaymentResponse = {
  Id: string;
  Status: string;
  ReferenceId: string;
  AuthorizationId?: string;
  Destination: string;
  RequesterName: string;
  RequesterDocument: string;
  RequesterContact: string;
  Amount: number;
  CreatedAt: Date;
  Historic?: TGetPaymentHistoricResponse[];
};

type TGetPaymentHistoricResponse = {
  Id: string;
  CheckoutId: string;
  CurrentStatus: string;
  PreviousStatus: string | null;
  Action: string;
  CreatedAt: Date;
};

export class GetPaymentHistoricResponse
  extends AutoValidator
  implements TGetPaymentHistoricResponse
{
  @IsString()
  Id: string;

  @IsString()
  CheckoutId: string;

  @IsString()
  CurrentStatus: string;

  @IsString()
  PreviousStatus: string | null;

  @IsString()
  Action: string;

  @IsDate()
  CreatedAt: Date;
}

export class GetPaymentResponse
  extends AutoValidator
  implements TGetPaymentResponse
{
  @IsUUID(4)
  Id: string;

  @IsString()
  Status: string;

  @IsString()
  @IsOptional()
  ReferenceId: string;

  @IsString()
  @IsOptional()
  AuthorizationId?: string;

  @IsString()
  Destination: string;

  @IsString()
  RequesterName: string;

  @IsString()
  RequesterDocument: string;

  @IsString()
  RequesterContact: string;

  @IsNumber()
  Amount: number;

  @IsDate()
  CreatedAt: Date;

  @IsOptional()
  Historic?: GetPaymentHistoricResponse[];

  constructor(props: TGetPaymentResponse) {
    super(props);
  }
}

export class GetPaymentController {
  private usecase: GetPaymentUseCase;

  constructor(
    private logger: Logger,
    checkoutRepository: CheckoutRepository,
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
  ) {
    this.logger = logger.child({
      context: GetPaymentController.name,
    });

    this.usecase = new GetPaymentUseCase(
      logger,
      checkoutRepository,
      checkoutHistoricRepository,
    );
  }

  async execute(checkoutId: string): Promise<GetPaymentResponse> {
    this.logger.debug('Get Cielo payment.', { checkoutId });

    const payment = await this.usecase.execute(checkoutId);

    if (!payment) return null;

    this.logger.info('Get Cielo payment response.', {
      payment,
    });

    return payment;
  }
}
