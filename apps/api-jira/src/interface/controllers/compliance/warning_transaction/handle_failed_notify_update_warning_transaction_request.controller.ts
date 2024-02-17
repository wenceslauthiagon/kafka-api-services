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
import { HandleFailedNotifyUpdateWarningTransactionIssueEventUseCase as UseCase } from '@zro/api-jira/application';
import {
  NotifyWarningTransactionIssue,
  NotifyWarningTransactionIssueEntity,
  NotifyWarningTransactionIssueRepository,
} from '@zro/api-jira/domain';
import {
  WarningTransactionAnalysisResultType,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import {
  NotifyWarningTransactionIssueEventEmitterController,
  NotifyWarningTransactionIssueEventEmitterControllerInterface,
} from '@zro/api-jira/interface';

type THandleFailedNotifyUpdateWarningTransactionIssueEventRequest = Pick<
  NotifyWarningTransactionIssue,
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
  | 'operationId'
  | 'summary'
  | 'analysisResult'
  | 'assigneeName'
  | 'creatorName'
  | 'reporterName'
>;
export class HandleFailedNotifyUpdateWarningTransactionIssueEventRequest
  extends AutoValidator
  implements THandleFailedNotifyUpdateWarningTransactionIssueEventRequest
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

  @IsEnum(WarningTransactionStatus)
  status: WarningTransactionStatus;

  @IsString()
  @MaxLength(255)
  @SanitizeHtml()
  summary!: string;

  @IsUUID(4)
  operationId!: string;

  @IsOptional()
  @IsEnum(WarningTransactionAnalysisResultType)
  analysisResult?: WarningTransactionAnalysisResultType;

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
    props: THandleFailedNotifyUpdateWarningTransactionIssueEventRequest,
  ) {
    super(props);
  }
}

export class HandleFailedNotifyUpdateWarningTransactionIssueEventController {
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
    notifyIssueRepository: NotifyWarningTransactionIssueRepository,
    eventEmitter: NotifyWarningTransactionIssueEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context:
        HandleFailedNotifyUpdateWarningTransactionIssueEventController.name,
    });

    const controllerEventEmitter =
      new NotifyWarningTransactionIssueEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      notifyIssueRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleFailedNotifyUpdateWarningTransactionIssueEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle failed issue event request.', { request });

    const notifyIssue = new NotifyWarningTransactionIssueEntity(request);

    await this.usecase.execute(notifyIssue);
  }
}
