import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  NotifyUserLimitRequestIssueEntity,
  NotifyUserLimitRequestIssueRepository,
  UserLimitRequestNotifyStateType,
  UserLimitRequestNotifyEventType,
} from '@zro/api-jira/domain';
import {
  UserLimitRequestEntity,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';
import {
  NotifyUserLimitRequestIssueInvalidStatusException,
  ComplianceService,
} from '@zro/api-jira/application';

export class HandleNotifyUpdateUserLimitRequestIssueEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyIssueRepository Global logger instance.
   * @param pixPaymentService Infraction service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyIssueRepository: NotifyUserLimitRequestIssueRepository,
    private readonly complianceService: ComplianceService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyUpdateUserLimitRequestIssueEventUseCase.name,
    });
  }

  /**
   * Notify update and send to compliance.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyUserLimitRequestIssueEntity): Promise<void> {
    this.logger.debug('Notify update received.', { payload });

    const { issueId, summary, userLimitRequestId, status } = payload;

    if (!issueId || !summary || !status || !userLimitRequestId) {
      throw new MissingDataException([
        ...(!issueId ? ['Issue ID'] : []),
        ...(!summary ? ['Summary'] : []),
        ...(!status ? ['Status'] : []),
        ...(!userLimitRequestId ? ['User limit request id'] : []),
      ]);
    }

    // Save all notify in database
    payload.state = UserLimitRequestNotifyStateType.READY;
    payload.eventType = UserLimitRequestNotifyEventType.UPDATED;

    await this.notifyIssueRepository.create(payload);

    switch (payload.status) {
      case UserLimitRequestStatus.CLOSED:
        return this.handleClosedUserLimitRequest(payload);

      default:
        this.logger.error('Invalid user limit request status', { payload });
        throw new NotifyUserLimitRequestIssueInvalidStatusException(payload);
    }
  }

  private async handleClosedUserLimitRequest(
    payload: NotifyUserLimitRequestIssueEntity,
  ) {
    const data = new UserLimitRequestEntity({
      id: payload.userLimitRequestId,
      analysisResult: payload.analysisResult,
    });

    await this.complianceService.closeUserLimitRequest(data);

    this.logger.debug('Closed User limit request.');
  }
}
