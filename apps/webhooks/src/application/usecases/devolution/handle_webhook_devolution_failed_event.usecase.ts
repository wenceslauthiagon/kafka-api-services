import { Logger } from 'winston';
import { MissingDataException, getMoment } from '@zro/common';
import {
  WebhookEvent,
  WebhookEventEntity,
  WebhookEventRepository,
  WebhookEventState,
  WebhookRepository,
  WebhookType,
} from '@zro/webhooks/domain';
import { PixDevolutionState, PixDevolution } from '@zro/pix-payments/domain';
import {
  WebhookEventEmitter,
  PixPaymentService,
  WebhookTargetGatewayPixDevolutionFailedRequest,
} from '@zro/webhooks/application';
import {
  PixDevolutionNotFoundException,
  PixDevolutionInvalidStateException,
} from '@zro/pix-payments/application';

export class HandleWebhookDevolutionFailedEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param webhookRepository Webhook repository.
   * @param webhookEventRepository Webhook Event repository.
   * @param pixPaymentService PixPayment service.
   * @param eventEmitter WebhookEvent event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly webhookRepository: WebhookRepository,
    private readonly webhookEventRepository: WebhookEventRepository,
    private readonly pixPaymentService: PixPaymentService,
    private readonly eventEmitter: WebhookEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleWebhookDevolutionFailedEventUseCase.name,
    });
  }

  /**
   * Handler triggered when devolution failed is received.
   *
   * @param {PixDevolutionFailed} devolutionFailed devolution failed.
   * @returns {WebhookEvent} WebhookEvent created.
   */
  async execute(devolutionFailed: PixDevolution): Promise<WebhookEvent> {
    // Data input check
    if (!devolutionFailed?.id) {
      throw new MissingDataException(['Devolution Failed']);
    }

    // Get pix devolution failed by id.
    const devolutionFailedFound =
      await this.pixPaymentService.getDevolutionById(devolutionFailed.id);

    this.logger.debug('Pix devolution failed found.', {
      devolutionFailedFound,
    });

    if (!devolutionFailedFound) {
      throw new PixDevolutionNotFoundException(devolutionFailed);
    }

    // Sanity check
    if (devolutionFailedFound.state !== PixDevolutionState.FAILED) {
      throw new PixDevolutionInvalidStateException(devolutionFailedFound);
    }

    // Get pix deposit associated with devolution.
    const depositFound = await this.pixPaymentService.getPixDepositById(
      devolutionFailedFound.deposit?.id,
    );

    this.logger.debug('Pix deposit associated found.', { depositFound });

    // Exists devolution failed webhook for this agency and account.
    const webhookFound =
      await this.webhookRepository.getActivateAndDevolutionFailedByAccountAndAgency(
        depositFound.clientAccountNumber,
        depositFound.clientBranch,
      );

    this.logger.debug('Webhook found.', { webhookFound });

    if (!webhookFound) {
      return;
    }

    // Mount webhook target gateway payload
    const webhookTargetPayload: WebhookTargetGatewayPixDevolutionFailedRequest =
      {
        id: devolutionFailedFound.id,
        endToEndId: devolutionFailedFound.endToEndId,
        txId: depositFound.txId,
        amount: devolutionFailedFound.amount,
        clientName: depositFound.clientName,
        operationId: devolutionFailedFound.operation?.id,
        clientPersonType: depositFound.clientPersonType,
        clientDocument: depositFound.clientDocument,
        clientAccountNumber: depositFound.clientAccountNumber,
        clientBranch: depositFound.clientBranch,
        clientBankName: depositFound.clientBank?.name,
        clientBankIspb: depositFound.clientBank?.ispb,
        thirdPartName: depositFound.thirdPartName,
        thirdPartPersonType: depositFound.thirdPartPersonType,
        thirdPartDocument: depositFound.thirdPartDocument,
        thirdPartBankName: depositFound.thirdPartBank?.name,
        thirdPartBankIspb: depositFound.thirdPartBank?.ispb,
        errorCode: devolutionFailedFound?.failed?.code,
        errorDescription: devolutionFailedFound?.failed?.message,
        createdAt: devolutionFailed.createdAt,
      };

    const webhookEvent = new WebhookEventEntity({
      state: WebhookEventState.PENDING,
      targetUrl: webhookFound.targetUrl,
      apiKey: webhookFound.apiKey,
      webhook: webhookFound,
      type: WebhookType.DEVOLUTION_FAILED,
      accountNumber: webhookFound.accountNumber,
      agencyNumber: webhookFound.agencyNumber,
      data: webhookTargetPayload,
      retryLimit: getMoment().add(7, 'days').toDate(),
    });

    const webhookCreated =
      await this.webhookEventRepository.create(webhookEvent);

    this.eventEmitter.created(webhookCreated);

    return webhookCreated;
  }
}
