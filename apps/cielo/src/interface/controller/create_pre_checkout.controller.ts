import { CreatePreCheckoutUseCase } from '@zro/cielo/application';
import { CheckoutRepository } from '@zro/cielo/domain';
import { AutoValidator } from '@zro/common';
import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { Logger } from 'winston';

export class AddressRequest {
  @IsString()
  Street: string;

  @IsString()
  Number: string;

  @IsString()
  Complement: string;

  @IsString()
  ZipCode: string;

  @IsString()
  City: string;

  @IsString()
  State: string;

  @IsString()
  Country: string;

  @IsString()
  District: string;
}

export class CustomerRequest {
  @IsString()
  Name: string;

  @IsString()
  Identity: string;

  @IsString()
  IdentityType: string;

  @IsString()
  Email: string;

  @IsObject()
  Address?: AddressRequest;
}

export class PreCheckoutPayment {
  Amount: number;
  Currency: string;
  Interest: string;
}

export type TCreatePreCheckoutRequest = {
  Customer: CustomerRequest;
  Payment: PreCheckoutPayment;
  MerchantOrderId: string;
};

export class CreatePreCheckoutRequest
  extends AutoValidator
  implements TCreatePreCheckoutRequest
{
  @IsObject()
  Customer: CustomerRequest;

  @IsObject()
  Payment: PreCheckoutPayment;

  @IsOptional()
  @IsString()
  MerchantOrderId: string;

  constructor(props: TCreatePreCheckoutRequest) {
    super(props);
  }
}

export type TCreatePreCheckoutResponse = {
  CheckoutId: string;
};

export class CreatePreCheckoutResponse
  extends AutoValidator
  implements TCreatePreCheckoutResponse
{
  @IsUUID(4)
  CheckoutId: string;
  constructor(props: TCreatePreCheckoutResponse) {
    super(props);
  }
}

export class CreatePreCheckoutController {
  private usecase: CreatePreCheckoutUseCase;

  constructor(
    private logger: Logger,
    checkoutRepository: CheckoutRepository,
  ) {
    this.logger = logger.child({
      context: CreatePreCheckoutController.name,
    });

    this.usecase = new CreatePreCheckoutUseCase(logger, checkoutRepository);
  }

  async execute(
    payload: CreatePreCheckoutRequest,
  ): Promise<CreatePreCheckoutResponse> {
    this.logger.debug('Create Cielo pre-checkout payment.', { payload });

    const payment = await this.usecase.execute(payload);

    if (!payment) return null;

    this.logger.info('Create Cielo pre-checkout payment response.', {
      payment: payment,
    });

    return payment;
  }
}
