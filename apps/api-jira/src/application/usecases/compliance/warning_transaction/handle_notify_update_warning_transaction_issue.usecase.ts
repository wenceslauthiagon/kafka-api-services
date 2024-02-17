import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  NotifyWarningTransactionIssueEntity,
  NotifyWarningTransactionIssueRepository,
  NotifyStateType,
  NotifyEventType,
} from '@zro/api-jira/domain';
import {
  WarningTransactionEntity,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import { OperationEntity } from '@zro/operations/domain';
import {
  ComplianceService,
  NotifyWarningTransactionIssueInvalidStatusException,
} from '@zro/api-jira/application';

export class HandleNotifyUpdateWarningTransactionIssueEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyIssueRepository Global logger instance.
   * @param complianceService Compliance service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyIssueRepository: NotifyWarningTransactionIssueRepository,
    private readonly complianceService: ComplianceService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyUpdateWarningTransactionIssueEventUseCase.name,
    });
  }

  /**
   * Notify update and send to compliance.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyWarningTransactionIssueEntity): Promise<void> {
    const { issueId, summary, operationId, status, analysisResult } = payload;

    if (!issueId || !summary || !status || !operationId || !analysisResult) {
      throw new MissingDataException([
        ...(!issueId ? ['Issue ID'] : []),
        ...(!summary ? ['summary'] : []),
        ...(!status ? ['Status'] : []),
        ...(!operationId ? ['Operation id'] : []),
        ...(!analysisResult ? ['Analysis result'] : []),
      ]);
    }

    // Idempotency check.
    const notifyWarningTransactionIssue =
      await this.notifyIssueRepository.getByIssueIdAndStatus(issueId, status);

    if (notifyWarningTransactionIssue) {
      return;
    }

    // Save all issue data in database
    payload.state = NotifyStateType.READY;
    payload.eventType = NotifyEventType.UPDATED;

    await this.notifyIssueRepository.create(payload);

    this.logger.debug('Notify update created.', { payload });

    switch (payload.status) {
      case WarningTransactionStatus.CLOSED:
        return this.handleClosedWarningTransaction(payload);

      default:
        this.logger.error('Invalid warning transaction status.', { payload });
        throw new NotifyWarningTransactionIssueInvalidStatusException(payload);
    }
  }

  private async handleClosedWarningTransaction(
    payload: NotifyWarningTransactionIssueEntity,
  ) {
    const operation = new OperationEntity({
      id: payload.operationId,
    });

    const data = new WarningTransactionEntity({
      operation,
      analysisResult: payload.analysisResult,
      ...(payload.analysisDetails && {
        analysisDetails: payload.analysisDetails,
      }),
    });

    await this.complianceService.closeWarningTransaction(data);

    this.logger.debug('Closed warning transaction.');
  }
}
