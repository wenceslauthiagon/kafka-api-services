import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  NotifyUserWithdrawSettingRequestIssueEntity,
  NotifyUserWithdrawSettingRequestIssueRepository,
  NotifyStateType,
  NotifyEventType,
} from '@zro/api-jira/domain';
import {
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';
import {
  ComplianceService,
  NotifyUserWithdrawSettingRequestIssueInvalidStatusException,
} from '@zro/api-jira/application';

export class HandleNotifyUpdateUserWithdrawSettingRequestIssueEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyIssueRepository Global logger instance.
   * @param complianceService Compliance service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyIssueRepository: NotifyUserWithdrawSettingRequestIssueRepository,
    private readonly complianceService: ComplianceService,
  ) {
    this.logger = logger.child({
      context:
        HandleNotifyUpdateUserWithdrawSettingRequestIssueEventUseCase.name,
    });
  }

  /**
   * Notify update and send to compliance.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    payload: NotifyUserWithdrawSettingRequestIssueEntity,
  ): Promise<void> {
    const {
      issueId,
      summary,
      userWithdrawSettingRequestId,
      status,
      analysisResult,
    } = payload;

    if (
      !issueId ||
      !summary ||
      !status ||
      !userWithdrawSettingRequestId ||
      !analysisResult
    ) {
      throw new MissingDataException([
        ...(!issueId ? ['Issue ID'] : []),
        ...(!summary ? ['summary'] : []),
        ...(!status ? ['Status'] : []),
        ...(!userWithdrawSettingRequestId
          ? ['User withdraw setting request id']
          : []),
        ...(!analysisResult ? ['Analysis result'] : []),
      ]);
    }

    const notifyUserWithdrawSettingRequestIssue =
      await this.notifyIssueRepository.getByIssueIdAndStatus(issueId, status);

    if (notifyUserWithdrawSettingRequestIssue) {
      return;
    }

    // Save all notify in database
    payload.state = NotifyStateType.READY;
    payload.eventType = NotifyEventType.UPDATED;

    await this.notifyIssueRepository.create(payload);

    this.logger.debug('Notify update created.', { payload });

    switch (payload.status) {
      case UserWithdrawSettingRequestState.CLOSED:
        return this.handleClosedUserWithdrawSettingRequest(payload);

      default:
        this.logger.error('Invalid user withdraw setting request status.', {
          payload,
        });
        throw new NotifyUserWithdrawSettingRequestIssueInvalidStatusException(
          payload,
        );
    }
  }

  private async handleClosedUserWithdrawSettingRequest(
    payload: NotifyUserWithdrawSettingRequestIssueEntity,
  ) {
    const data = new UserWithdrawSettingRequestEntity({
      id: payload.userWithdrawSettingRequestId,
      analysisResult: payload.analysisResult,
    });

    await this.complianceService.closeUserWithdrawSettingRequest(data);

    this.logger.debug('Closed user withdraw setting request.');
  }
}
