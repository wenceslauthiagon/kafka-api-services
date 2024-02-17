import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  Checkout,
  CheckoutHistoric,
  CheckoutHistoricRepository,
  CheckoutRepository,
  PaymentStatusEnum,
} from '@zro/nupay/domain';
import {
  PreCheckoutRequest,
  PreCheckoutResponse,
  nupayConstants,
} from '@zro/nupay/interface';

export class PreCheckoutUseCase {
  constructor(
    private logger: Logger,
    private readonly checkoutRepository: CheckoutRepository,
    private readonly checkoutHistoricRepository: CheckoutHistoricRepository,
  ) {}

  async execute(request: PreCheckoutRequest): Promise<PreCheckoutResponse> {
    const { firstName, lastName, document, email, phone } = request.shopper;
    this.logger.debug('Receive NuPay Pre-Checkout data.', { request });

    const data = new Date();
    const expiresAt = new Date(data);
    expiresAt.setDate(expiresAt.getDate() + 1);

    const payment: Checkout = {
      id: uuidV4(),
      referenceId: null,
      status: PaymentStatusEnum.PRE_CHECKOUT,
      authorizationId: null,
      destination: email,
      requesterName: `${firstName} ${lastName}`,
      requesterContact: phone,
      requesterDocument: document,
      amount: request.amount,
      currency: nupayConstants.payment.currency,
      payload: request,
      createdAt: data,
      updatedAt: data,
      expiresAt: expiresAt,
    };

    const checkout = await this.checkoutRepository.create(payment);
    this.logger.debug('Created Checkout data.', { checkout });

    const historicModel = this.createCheckoutHistoric(
      checkout.id,
      PaymentStatusEnum.PRE_CHECKOUT,
    );

    await this.checkoutHistoricRepository.create(historicModel);
    this.logger.debug('Created Checkout Historic data.', { historicModel });

    return { checkoutId: checkout.id };
  }

  private createCheckoutHistoric(
    checkoutId: string,
    currentStatus: PaymentStatusEnum,
  ): CheckoutHistoric {
    const historic: CheckoutHistoric = {
      id: uuidV4(),
      checkoutId: checkoutId,
      currentStatus: currentStatus,
      previousStatus: null,
      action: 'Create Pre-Checkout',
      response: {
        checkoutId,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return historic;
  }
}
