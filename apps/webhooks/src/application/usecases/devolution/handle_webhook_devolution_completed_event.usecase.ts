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
  WebhookTargetGatewayPixDevolutionCompletedRequest,
} from '@zro/webhooks/application';
import {
  PixDepositNotFoundException,
  PixDevolutionNotFoundException,
  PixDevolutionInvalidStateException,
} from '@zro/pix-payments/application';

export class HandleWebhookDevolutionCompletedEventUseCase {
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
      context: HandleWebhookDevolutionCompletedEventUseCase.name,
    });
  }

  /**
   * Handler triggered when devolution received is received.
   *
   * @param {PixDevolution} devolution devolution received.
   * @returns {WebhookEvent} WebhookEvent created.
   */
  async execute(devolution: PixDevolution): Promise<WebhookEvent> {
    // Data input check
    if (!devolution?.id) {
      throw new MissingDataException(['Devolution']);
    }

    // Get pix devolution received by id.
    const devolutionFound = await this.pixPaymentService.getDevolutionById(
      devolution.id,
    );

    if (!devolutionFound) {
      throw new PixDevolutionNotFoundException(devolution);
    }

    this.logger.debug('Pix devolution received found.', { devolutionFound });

    // Indepotent
    if (devolutionFound.state !== PixDevolutionState.CONFIRMED) {
      throw new PixDevolutionInvalidStateException(devolution);
    }

    // Get pix deposit associated with devolution.
    const depositFound = await this.pixPaymentService.getPixDepositById(
      devolutionFound.deposit?.id,
    );

    this.logger.debug('Pix deposit associated found.', { depositFound });

    if (!depositFound) {
      throw new PixDepositNotFoundException(devolutionFound.deposit);
    }

    // Exists devolution received webhook for this agency and account.
    const webhookFound =
      await this.webhookRepository.getActivateAndDevolutionCompletedByAccountAndAgency(
        depositFound?.clientAccountNumber,
        depositFound?.clientBranch,
      );

    this.logger.debug('Webhook found.', { webhookFound });

    if (!webhookFound) {
      return;
    }

    // Mount webhook target gateway payload
    const webhookTargetPayload: WebhookTargetGatewayPixDevolutionCompletedRequest =
      {
        id: devolutionFound.id,
        endToEndId: devolutionFound.endToEndId,
        txId: depositFound.txId,
        amount: devolutionFound.amount,
        clientName: depositFound.clientName,
        operationId: devolutionFound.operation?.id,
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
        createdAt: devolution.createdAt,
      };

    const webhookEvent = new WebhookEventEntity({
      state: WebhookEventState.PENDING,
      targetUrl: webhookFound.targetUrl,
      apiKey: webhookFound.apiKey,
      webhook: webhookFound,
      type: WebhookType.DEVOLUTION_COMPLETED,
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
