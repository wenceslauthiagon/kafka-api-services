import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  NotifyPixInfractionIssueEntity,
  NotifyPixInfractionIssueRepository,
  NotifyStateType,
  NotifyEventType,
} from '@zro/api-jira/domain';
import {
  PixInfractionEntity,
  PixInfractionStatus,
} from '@zro/pix-payments/domain';
import {
  PixPaymentService,
  NotifyPixInfractionIssueInvalidStatusException,
} from '@zro/api-jira/application';

export class HandleNotifyUpdatePixInfractionIssueEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyIssueRepository Global logger instance.
   * @param pixPaymentService Infraction service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyIssueRepository: NotifyPixInfractionIssueRepository,
    private readonly pixPaymentService: PixPaymentService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyUpdatePixInfractionIssueEventUseCase.name,
    });
  }

  /**
   * Notify update and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyPixInfractionIssueEntity): Promise<void> {
    this.logger.debug('Notify update received.', { payload });

    const { issueId, infractionType, summary, operationId, status } = payload;

    if (!issueId || !infractionType || !summary || !operationId || !status) {
      throw new MissingDataException([
        ...(!issueId ? ['Issue ID'] : []),
        ...(!infractionType ? ['Infraction Type'] : []),
        ...(!operationId ? ['Operation ID'] : []),
        ...(!summary ? ['Summary'] : []),
        ...(!status ? ['Status'] : []),
      ]);
    }

    // Check indepotent
    const notifyPixInfractionIssue =
      await this.notifyIssueRepository.getByIssueIdAndStatus(issueId, status);

    if (notifyPixInfractionIssue) {
      return;
    }

    // Save all notify in database
    payload.state = NotifyStateType.READY;
    payload.eventType = NotifyEventType.UPDATED;

    await this.notifyIssueRepository.create(payload);

    switch (payload.status) {
      case PixInfractionStatus.OPENED:
        return this.handleOpenInfraction(payload);

      case PixInfractionStatus.IN_ANALYSIS:
        return this.handleInAnalysisInfraction(payload);

      case PixInfractionStatus.CLOSED:
        return this.handleClosedInfraction(payload);

      case PixInfractionStatus.CANCELLED:
        return this.handleCanceledInfraction(payload);

      default:
        this.logger.error('Invalid infraction status', { payload });
        throw new NotifyPixInfractionIssueInvalidStatusException(payload);
    }
  }

  private async handleOpenInfraction(payload: NotifyPixInfractionIssueEntity) {
    const data = new PixInfractionEntity({
      issueId: payload.issueId,
      description: payload.description,
    });

    const infraction = await this.pixPaymentService.openPixInfraction(data);
    this.logger.debug('Opened infraction.', { infraction });
  }

  private async handleInAnalysisInfraction(
    payload: NotifyPixInfractionIssueEntity,
  ) {
    const data = new PixInfractionEntity({
      issueId: payload.issueId,
      description: payload.description,
    });

    const infraction =
      await this.pixPaymentService.inAnalysisPixInfraction(data);
    this.logger.debug('In Analysis infraction.', { infraction });
  }

  private async handleClosedInfraction(
    payload: NotifyPixInfractionIssueEntity,
  ) {
    const data = new PixInfractionEntity({
      issueId: payload.issueId,
      analysisDetails: payload.analysisDetails,
      analysisResult: payload.analysisResult,
    });

    const infraction = await this.pixPaymentService.closePixInfraction(data);
    this.logger.debug('Closed infraction.', { infraction });
  }

  private async handleCanceledInfraction(
    payload: NotifyPixInfractionIssueEntity,
  ) {
    const infraction = await this.pixPaymentService.cancelPixInfraction(
      payload.issueId,
    );
    this.logger.debug('Canceled infraction.', { infraction });
  }
}
