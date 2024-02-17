import { Logger } from 'winston';
import { CheckoutRepository } from '@zro/nupay/domain';
import {
  GetAllPaymentResponse,
  GetAllPaymentResponseItem,
} from '@zro/nupay/interface';
export class GetAllPaymentUseCase {
  constructor(
    private logger: Logger,
    private readonly checkoutRepository: CheckoutRepository,
  ) {}

  async execute(): Promise<GetAllPaymentResponse> {
    this.logger.debug('Get all payments');
    const checkouts = await this.checkoutRepository.getAll();

    return new GetAllPaymentResponse({
      payments: checkouts.map(
        (item) =>
          new GetAllPaymentResponseItem({
            id: item.id,
            status: item.status,
            referenceId: item.referenceId,
            authorizationId: item.authorizationId,
            destination: item.destination,
            requesterName: item.requesterName,
            requesterDocument: item.requesterDocument,
            requesterContact: item.requesterContact,
            currency: item.currency,
            amount: item.amount,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            expiresAt: item.expiresAt,
          }),
      ),
    });
  }
}
