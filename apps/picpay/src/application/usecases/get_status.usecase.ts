import { Logger } from 'winston';
import {
  CheckoutHistoricRepository,
  CheckoutRepository,
  PaymentStatusEnum,
} from '@zro/picpay/domain';
import { GetPaymentStatusResponse } from '@zro/picpay/interface';

export class GetPaymentStatusUseCase {
  constructor(
    private logger: Logger,
    private readonly checkoutRepository: CheckoutRepository,
    private readonly checkoutHistoricRepository: CheckoutHistoricRepository,
  ) {
    this.logger = logger.child({ context: GetPaymentStatusUseCase.name });
  }

  async execute(checkoutId: string): Promise<GetPaymentStatusResponse> {
    this.logger.debug('Receive get payment status data.', { checkoutId });

    const checkout = await this.checkoutRepository.getById(checkoutId);

    const checkoutHistoric =
      await this.checkoutHistoricRepository.findByCheckoutId(checkoutId);

    this.logger.debug('Receive checkout historic payment.', {
      checkoutHistoric,
    });

    const createdEntry = checkoutHistoric.find(
      (x) => x.currentStatus === PaymentStatusEnum.CREATED,
    );

    if (createdEntry) {
      checkout.payload = createdEntry.response;
    }

    this.logger.debug('Received get payment status data.', { checkout });

    return checkout;
  }
}
