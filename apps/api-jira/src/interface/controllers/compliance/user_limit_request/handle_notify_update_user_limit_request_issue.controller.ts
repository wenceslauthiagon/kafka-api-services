import { Logger } from 'winston';
import {
  AutoValidator,
  IsIsoStringDateFormat,
  SanitizeHtml,
} from '@zro/common';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  IsUUID,
  IsInt,
  IsPositive,
} from 'class-validator';
import {
  ComplianceService,
  HandleNotifyUpdateUserLimitRequestIssueEventUseCase as UseCase,
} from '@zro/api-jira/application';
import {
  NotifyUserLimitRequestIssue,
  NotifyUserLimitRequestIssueEntity,
  NotifyUserLimitRequestIssueRepository,
} from '@zro/api-jira/domain';
import {
  UserLimitRequestAnalysisResultType,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';

type THandleNotifyUpdateUserLimitRequestIssueEventRequest = Pick<
  NotifyUserLimitRequestIssue,
  | 'issueId'
  | 'issueTypeId'
  | 'issueTypeName'
  | 'issueCreatedAt'
  | 'projectId'
  | 'projectKey'
  | 'projectName'
  | 'priorityId'
  | 'priorityName'
  | 'statusId'
  | 'status'
  | 'userLimitRequestId'
  | 'summary'
  | 'analysisResult'
  | 'assigneeName'
  | 'creatorName'
  | 'reporterName'
>;
export class HandleNotifyUpdateUserLimitRequestIssueEventRequest
  extends AutoValidator
  implements THandleNotifyUpdateUserLimitRequestIssueEventRequest
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
  @IsString()
  @MaxLength(255)
  priorityName?: string;

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

  constructor(props: THandleNotifyUpdateUserLimitRequestIssueEventRequest) {
    super(props);
  }
}

export class HandleNotifyUpdateUserLimitRequestIssueEventController {
  /**
   * Handler triggered to create notify completion.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param notifyIssueRepository Notify Issue repository.
   * @param complianceService Compliance Service.
   */
  constructor(
    private logger: Logger,
    notifyIssueRepository: NotifyUserLimitRequestIssueRepository,
    complianceService: ComplianceService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyUpdateUserLimitRequestIssueEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      notifyIssueRepository,
      complianceService,
    );
  }

  async execute(
    request: HandleNotifyUpdateUserLimitRequestIssueEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle update user limit request issue event request.', {
      request,
    });

    const notifyUpdateUserLimitRequestIssue =
      new NotifyUserLimitRequestIssueEntity(request);

    await this.usecase.execute(notifyUpdateUserLimitRequestIssue);
  }
}
