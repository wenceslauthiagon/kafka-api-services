import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { IPaymentsService } from '@zro/picpay/application';
import {
  CheckoutHistoric,
  CheckoutRepository,
  CheckoutHistoricRepository,
} from '@zro/picpay/domain';
import {
  CreateRefundRequest,
  CreateRefundResponse,
} from '@zro/picpay/interface';

export class CreateRefundUseCase {
  constructor(
    private logger: Logger,
    private picpayService: IPaymentsService,
    private checkoutRepository: CheckoutRepository,
    private checkoutHistoricRepository: CheckoutHistoricRepository,
  ) {}

  async execute(request: CreateRefundRequest): Promise<CreateRefundResponse> {
    this.logger.debug('Receive payment refund data.', { request });

    const result = await this.picpayService.createRefund(request);

    this.logger.debug('Created refund data.', { result });

    const picpayModel = await this.picpayService.getPaymentNotification(
      request.referenceId,
    );
    const model = await this.checkoutRepository.getByReferenceId(
      request.referenceId,
    );

    const historicModel = await this.checkoutHistoricRepository.create(
      this.createHistoricModel(
        model.id,
        model.status,
        picpayModel.status,
        request,
        result,
      ),
    );

    this.logger.debug('Created Checkout Historic data.', { historicModel });

    result.status = picpayModel.status;
    model.status = picpayModel.status;

    await this.checkoutRepository.update(model);
    return result;
  }

  private createHistoricModel(
    checkoutId: string,
    previousStatus: string,
    currentStatus: string,
    request: CreateRefundRequest,
    response: CreateRefundResponse,
  ) {
    const historicModel: CheckoutHistoric = {
      id: uuidV4(),
      checkoutId: checkoutId,
      action:
        request.authorizationId == null ? 'CreateRefund' : 'CreateCancellation',
      previousStatus: previousStatus,
      currentStatus: currentStatus,
      response: JSON.stringify(response),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return historicModel;
  }
}
