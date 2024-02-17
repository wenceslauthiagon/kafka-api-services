import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  NotifyPixInfractionIssueEntity,
  NotifyPixInfractionIssueRepository,
  NotifyStateType,
  NotifyEventType,
} from '@zro/api-jira/domain';
import { OperationEntity } from '@zro/operations/domain';
import { PixInfractionEntity } from '@zro/pix-payments/domain';
import { PixPaymentService } from '@zro/api-jira/application';

export class HandleNotifyCreatePixInfractionIssueEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyIssueRepository Global logger instance.
   * @param createInfractionService Create Infraction service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyIssueRepository: NotifyPixInfractionIssueRepository,
    private readonly pixPaymentService: PixPaymentService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyCreatePixInfractionIssueEventUseCase.name,
    });
  }

  /**
   * Notify create and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyPixInfractionIssueEntity): Promise<void> {
    this.logger.debug('Notify create received.', { payload });

    const {
      issueId,
      infractionType,
      summary,
      operationId,
      description,
      status,
    } = payload;

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
    payload.eventType = NotifyEventType.CREATED;
    await this.notifyIssueRepository.create(payload);

    const infraction = new PixInfractionEntity({
      id: uuidV4(),
      issueId,
      infractionType,
      description,
      status,
      operation: new OperationEntity({ id: operationId }),
    });

    this.logger.debug('send to service.', { infraction });
    await this.pixPaymentService.createPixInfraction(infraction);

    this.logger.debug('Event sent.');
  }
}
