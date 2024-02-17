import { Logger } from 'winston';
import { AutoValidator } from '@zro/common';
import { CreatePreCheckoutUseCase } from '@zro/picpay/application';
import {
  Buyer,
  CheckoutRepository,
  CheckoutHistoricRepository,
} from '@zro/picpay/domain';
import { IsNumber, IsObject, IsPositive, IsUUID } from 'class-validator';

export type TCreatePreCheckoutRequest = {
  buyer: Buyer;
  value: number;
};

export class CreatePreCheckoutRequest
  extends AutoValidator
  implements TCreatePreCheckoutRequest
{
  @IsObject()
  buyer: Buyer;

  @IsNumber()
  @IsPositive()
  value: number;

  constructor(props: TCreatePreCheckoutRequest) {
    super(props);
  }
}

type TCreatePreCheckoutResponse = {
  checkoutId: string;
};

export class CreatePreCheckoutResponse
  extends AutoValidator
  implements TCreatePreCheckoutResponse
{
  @IsUUID(4)
  checkoutId: string;
  constructor(props: TCreatePreCheckoutResponse) {
    super(props);
  }
}

export class CreatePreCheckoutController {
  private usecase: CreatePreCheckoutUseCase;

  constructor(
    private logger: Logger,
    checkoutRepository: CheckoutRepository,
    checkoutHistoricRepository: CheckoutHistoricRepository,
  ) {
    this.logger = logger.child({
      context: CreatePreCheckoutController.name,
    });

    this.usecase = new CreatePreCheckoutUseCase(
      logger,
      checkoutRepository,
      checkoutHistoricRepository,
    );
  }

  async execute(
    payload: CreatePreCheckoutRequest,
  ): Promise<CreatePreCheckoutResponse> {
    this.logger.debug('Create PicPay pre-checkout payment.', { payload });

    const payment = await this.usecase.execute(payload);

    if (!payment) return null;

    const response = new CreatePreCheckoutResponse({
      checkoutId: payment.checkoutId,
    });

    this.logger.info('Create PicPay pre-checkout payment response.', {
      payment: response,
    });

    return response;
  }
}
