import { AutoValidator } from '@zro/common';
import { PreCheckoutUseCase } from '@zro/nupay/application';
import {
  CheckoutRepository,
  CheckoutHistoricRepository,
} from '@zro/nupay/domain';
import { Address } from '@zro/nupay/domain/entities/address.entity';
import { Item } from '@zro/nupay/domain/entities/item.entity';
import { Shopper } from '@zro/nupay/domain/entities/shopper.entity';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { Logger } from 'winston';

export type TPreCheckoutRequest = {
  merchantName?: string;
  amount: number;
  shopper: Shopper;
  items: Array<Item>;
  billingAddress: Address;
};

export class PreCheckoutRequest
  extends AutoValidator
  implements TPreCheckoutRequest
{
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsObject()
  shopper: Shopper;

  @IsArray()
  items: Array<Item>;

  @IsObject()
  billingAddress: Address;

  @IsString()
  @IsOptional()
  merchantName?: string;

  constructor(props: TPreCheckoutRequest) {
    super(props);
  }
}

type TPreCheckoutResponse = {
  checkoutId: string;
};

export class PreCheckoutResponse
  extends AutoValidator
  implements TPreCheckoutResponse
{
  @IsUUID(4)
  checkoutId: string;
  constructor(props: TPreCheckoutResponse) {
    super(props);
  }
}

export class PreCheckoutController {
  private usecase: PreCheckoutUseCase;

  constructor(
    private logger: Logger,
    checkoutRepository: CheckoutRepository,
    checkoutHistoricRepository: CheckoutHistoricRepository,
  ) {
    this.logger = logger.child({
      context: PreCheckoutController.name,
    });

    this.usecase = new PreCheckoutUseCase(
      logger,
      checkoutRepository,
      checkoutHistoricRepository,
    );
  }

  async execute(payload: PreCheckoutRequest): Promise<PreCheckoutResponse> {
    this.logger.debug('Create NuPay pre-checkout payment.', { payload });

    const payment = await this.usecase.execute(payload);

    if (!payment) return null;

    const response = new PreCheckoutResponse({
      checkoutId: payment.checkoutId,
    });

    this.logger.info('Create NuPay pre-checkout payment response.', {
      payment: response,
    });

    return response;
  }
}
