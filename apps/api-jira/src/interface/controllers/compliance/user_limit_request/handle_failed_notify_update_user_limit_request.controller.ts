import { Logger } from 'winston';
import {
  IsEnum,
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  IsNumber,
  IsInt,
  IsPositive,
} from 'class-validator';
import {
  AutoValidator,
  IsIsoStringDateFormat,
  SanitizeHtml,
} from '@zro/common';
import { HandleFailedNotifyUpdateUserLimitRequestIssueEventUseCase as UseCase } from '@zro/api-jira/application';
import {
  NotifyUserLimitRequestIssue,
  NotifyUserLimitRequestIssueEntity,
  NotifyUserLimitRequestIssueRepository,
} from '@zro/api-jira/domain';
import {
  NotifyUserLimitRequestIssueEventEmitterControllerInterface,
  NotifyUserLimitRequestIssueEventEmitterController,
} from '@zro/api-jira/interface';
import {
  UserLimitRequestAnalysisResultType,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';

type THandleFailedNotifyUpdateUserLimitRequestIssueEventRequest = Pick<
  NotifyUserLimitRequestIssue,
  | 'issueId'
  | 'issueTypeId'
  | 'issueTypeName'
  | 'issueCreatedAt'
  | 'projectId'
  | 'projectKey'
  | 'projectName'
  | 'priorityId'
  | 'statusId'
  | 'status'
  | 'userLimitRequestId'
  | 'summary'
  | 'analysisResult'
  | 'assigneeName'
  | 'creatorName'
  | 'reporterName'
>;

export class HandleFailedNotifyUpdateUserLimitRequestIssueEventRequest
  extends AutoValidator
  implements THandleFailedNotifyUpdateUserLimitRequestIssueEventRequest
{
  @IsInt()
  @IsPositive()
  issueId: number;

  @IsOptional()
  @IsNumber()
  issueTypeId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  issueTypeName?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format issueCreatedAt',
  })
  issueCreatedAt: Date;

  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  projectKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  projectName?: string;

  @IsOptional()
  @IsNumber()
  priorityId?: number;

  @IsOptional()
  @IsNumber()
  statusId?: number;

  @IsEnum(UserLimitRequestStatus)
  status: UserLimitRequestStatus;

  @IsString()
  @MaxLength(255)
  @SanitizeHtml()
  summary!: string;

  @IsUUID(4)
  userLimitRequestId!: string;

  @IsOptional()
  @IsEnum(UserLimitRequestAnalysisResultType)
  analysisResult?: UserLimitRequestAnalysisResultType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  assigneeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  creatorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reporterName?: string;

  constructor(
    props: THandleFailedNotifyUpdateUserLimitRequestIssueEventRequest,
  ) {
    super(props);
  }
}

export class HandleFailedNotifyUpdateUserLimitRequestIssueEventController {
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
    notifyIssueRepository: NotifyUserLimitRequestIssueRepository,
    eventEmitter: NotifyUserLimitRequestIssueEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context:
        HandleFailedNotifyUpdateUserLimitRequestIssueEventController.name,
    });

    const controllerEventEmitter =
      new NotifyUserLimitRequestIssueEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      notifyIssueRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleFailedNotifyUpdateUserLimitRequestIssueEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle failed issue event request.', { request });

    const notifyIssue = new NotifyUserLimitRequestIssueEntity(request);

    await this.usecase.execute(notifyIssue);
  }
}
