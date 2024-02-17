import { Logger } from 'winston';
import { AutoValidator } from '@zro/common';
import { CreateRefundUseCase, IPaymentsService } from '@zro/picpay/application';
import {
  CheckoutRepository,
  CheckoutHistoricRepository,
} from '@zro/picpay/domain';
import { IsOptional, IsString } from 'class-validator';

export type TCreateRefundRequest = {
  referenceId: string;
  authorizationId: string;
};

export class CreateRefundRequest
  extends AutoValidator
  implements TCreateRefundRequest
{
  @IsString()
  referenceId: string;

  @IsString()
  authorizationId: string;
  constructor(props: TCreateRefundRequest) {
    super(props);
  }
}

type TCreateRefundResponse = {
  referenceId: string;
  status: string;
  cancellationId?: string;
  authorizationId?: string;
};

export class CreateRefundResponse
  extends AutoValidator
  implements TCreateRefundResponse
{
  @IsString()
  referenceId: string;

  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  cancellationId?: string;

  @IsString()
  @IsOptional()
  authorizationId?: string;
  constructor(props: TCreateRefundResponse) {
    super(props);
  }
}

export class CreateRefundController {
  private usecase: CreateRefundUseCase;

  constructor(
    private logger: Logger,
    service: IPaymentsService,
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

  async execute(payload: CreateRefundRequest): Promise<CreateRefundResponse> {
    this.logger.debug('Create payment refund.', { payload });

    const payment = await this.usecase.execute(payload);

    if (!payment) return null;

    const response = new CreateRefundResponse({
      referenceId: payment.referenceId,
      status: payment.status,
      cancellationId: payment.cancellationId,
      authorizationId: payment.authorizationId,
    });

    this.logger.info('Create payment refund response.', {
      payment: response,
    });

    return response;
  }
}
