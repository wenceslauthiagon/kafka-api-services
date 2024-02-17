import { Logger } from 'winston';
import { AutoValidator } from '@zro/common';
import { IsString, IsUUID } from 'class-validator';
import {
  CancelTransactionUsecase,
  ICieloService,
} from '@zro/cielo/application';
import {
  CheckoutHistoricRepository,
  CheckoutRepository,
} from '@zro/cielo/domain';

export type TCancelTransactionRequest = {
  CheckoutId: string;
};

export class CancelTransactionRequest
  extends AutoValidator
  implements TCancelTransactionRequest
{
  @IsUUID(4)
  CheckoutId: string;
}

type TCancelTransactionResponse = {
  CheckoutId: string;
  Status: string;
};

export class CancelTransactionResponse
  extends AutoValidator
  implements TCancelTransactionResponse
{
  @IsUUID(4)
  CheckoutId: string;

  @IsString()
  Status: string;

  constructor(props: TCancelTransactionResponse) {
    super(props);
  }
}

export class CancelTransactionController {
  private usecase: CancelTransactionUsecase;

  constructor(
    private logger: Logger,
    service: ICieloService,
    checkoutRepository: CheckoutRepository,
    checkoutHistoricRepository: CheckoutHistoricRepository,
  ) {
    this.logger = logger.child({
      context: CancelTransactionController.name,
    });

    this.usecase = new CancelTransactionUsecase(
      logger,
      service,
      checkoutRepository,
      checkoutHistoricRepository,
    );
  }

  async execute(
    request: CancelTransactionRequest,
  ): Promise<CancelTransactionResponse> {
    this.logger.debug('Cancel/refund transaction.', { request });

    const payment = await this.usecase.execute(request.CheckoutId);

    if (!payment) return null;

    this.logger.info('Cancel/refund transaction response.', {
      payment,
    });

    return payment;
  }
}
