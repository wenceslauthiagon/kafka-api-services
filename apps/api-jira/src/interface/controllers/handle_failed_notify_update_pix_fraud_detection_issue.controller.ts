import { Logger } from 'winston';
import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { HandleFailedNotifyUpdatePixFraudDetectionIssueEventUseCase as UseCase } from '@zro/api-jira/application';
import {
  NotifyPixFraudDetectionIssue,
  NotifyPixFraudDetectionIssueEntity,
  NotifyPixFraudDetectionIssueRepository,
} from '@zro/api-jira/domain';
import { PixFraudDetectionStatus } from '@zro/pix-payments/domain';
import {
  NotifyPixFraudDetectionIssueEventEmitterControllerInterface,
  NotifyPixFraudDetectionIssueEventEmitterController,
} from '@zro/api-jira/interface';

type THandleFailedNotifyUpdatePixFraudDetectionIssueEventRequest = Pick<
  NotifyPixFraudDetectionIssue,
  'issueId' | 'status'
>;

export class HandleFailedNotifyUpdatePixFraudDetectionIssueEventRequest
  extends AutoValidator
  implements THandleFailedNotifyUpdatePixFraudDetectionIssueEventRequest
{
  @IsInt()
  @IsPositive()
  issueId: number;

  @IsEnum(PixFraudDetectionStatus)
  status: PixFraudDetectionStatus;

  constructor(
    props: THandleFailedNotifyUpdatePixFraudDetectionIssueEventRequest,
  ) {
    super(props);
  }
}

export class HandleFailedNotifyUpdatePixFraudDetectionIssueEventController {
  /**
   * Handler triggered to update notify completion.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    private logger: Logger,
    notifyIssueRepository: NotifyPixFraudDetectionIssueRepository,
    eventEmitter: NotifyPixFraudDetectionIssueEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context:
        HandleFailedNotifyUpdatePixFraudDetectionIssueEventController.name,
    });

    const controllerEventEmitter =
      new NotifyPixFraudDetectionIssueEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      notifyIssueRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleFailedNotifyUpdatePixFraudDetectionIssueEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle failed issue event request.', { request });

    const notifyIssue = new NotifyPixFraudDetectionIssueEntity(request);
    await this.usecase.execute(notifyIssue);
  }
}
