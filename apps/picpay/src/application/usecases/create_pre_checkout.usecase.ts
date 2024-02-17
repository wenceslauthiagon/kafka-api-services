import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  Checkout,
  CheckoutHistoric,
  PaymentStatusEnum,
  CheckoutRepository,
  CheckoutHistoricRepository,
} from '@zro/picpay/domain';
import {
  CreatePreCheckoutRequest,
  CreatePreCheckoutResponse,
} from '@zro/picpay/interface';

export class CreatePreCheckoutUseCase {
  constructor(
    private logger: Logger,
    private readonly checkoutRepository: CheckoutRepository,
    private readonly checkoutHistoricRepository: CheckoutHistoricRepository,
  ) {
    this.logger = logger.child({ context: CreatePreCheckoutUseCase.name });
  }

  async execute(
    request: CreatePreCheckoutRequest,
  ): Promise<CreatePreCheckoutResponse> {
    const { firstName, lastName, document, email, phone } = request.buyer;

    this.logger.debug('Receive Picpay Pre-Checkout data.', { request });

    const data = new Date();
    const expiresAt = new Date(data);
    expiresAt.setDate(expiresAt.getDate() + 1);

    const payment: Checkout = {
      id: uuidV4(),
      status: PaymentStatusEnum.PRECHECKOUT,
      referenceId: uuidV4(),
      payload: null,
      authorizationId: null,
      destination: email,
      requesterName: `${firstName} ${lastName}`,
      requesterContact: phone,
      requesterDocument: document,
      amount: request.value,
      createdAt: data,
      updatedAt: data,
      expiresAt: expiresAt,
    };

    const checkout = await this.checkoutRepository.create(payment);
    this.logger.debug('Created Checkout data.', { checkout });

    const historicModel = this.createCheckoutHistoric(
      checkout.id,
      PaymentStatusEnum.PRECHECKOUT,
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
      response: JSON.stringify({
        checkoutId,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return historic;
  }
}
