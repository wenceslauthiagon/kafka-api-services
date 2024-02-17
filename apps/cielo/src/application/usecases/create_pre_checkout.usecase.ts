import * as uuid from 'uuid';
import { Logger } from 'winston';
import { Checkout, CheckoutRepository } from '@zro/cielo/domain';
import {
  CreatePreCheckoutRequest,
  CreatePreCheckoutResponse,
} from '@zro/cielo/interface';

export class CreatePreCheckoutUseCase {
  constructor(
    private logger: Logger,
    private readonly checkoutRepository: CheckoutRepository,
  ) {
    this.logger = logger.child({ context: CreatePreCheckoutUseCase.name });
  }

  async execute(
    request: CreatePreCheckoutRequest,
  ): Promise<CreatePreCheckoutResponse> {
    const { Name, Identity, Email } = request.Customer;
    const { Amount, Currency } = request.Payment;

    this.logger.debug('Receive Cielo Pre-Checkout data.', { request });

    const data = new Date();
    const expiresAt = new Date(data);
    expiresAt.setDate(expiresAt.getDate() + 1);

    const payment: Checkout = {
      id: uuid.v4(),
      status: 'pre_checkout',
      referenceId: null,
      payload: request,
      authorizationId: null,
      destination: Email,
      requesterName: Name,
      requesterContact: Email,
      requesterDocument: Identity,
      currency: Currency,
      amount: Amount,
      createdAt: data,
      updatedAt: data,
      expiresAt: expiresAt,
    };
    request.MerchantOrderId = this.generateMerchantOrder();

    const checkout = await this.checkoutRepository.create(payment);

    this.logger.debug('Created Checkout data.', { checkout });

    return { CheckoutId: checkout.id };
  }

  //Created to specify an order on Cielo pattern
  private generateMerchantOrder(): string {
    const uuidValue = uuid.v4().replace(/-/g, '');
    const dateToday = new Date();
    const date = `${dateToday.getDate()}${
      dateToday.getMonth() + 1
    }${dateToday.getFullYear()}`;
    const threshold = 50 - date.length;
    const code = uuidValue.substring(0, threshold);
    const orderId = `${date}.${code}`;

    return orderId;
  }
}
