import { Logger } from 'winston';
import {
  IsEnum,
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  IsNumber,
  Length,
} from 'class-validator';
import {
  AutoValidator,
  IsIsoStringDateFormat,
  SanitizeHtml,
} from '@zro/common';
import { HandleFailedNotifyUpdateUserWithdrawSettingRequestIssueEventUseCase as UseCase } from '@zro/api-jira/application';
import {
  NotifyUserWithdrawSettingRequestIssue,
  NotifyUserWithdrawSettingRequestIssueEntity,
  NotifyUserWithdrawSettingRequestIssueRepository,
} from '@zro/api-jira/domain';
import {
  UserWithdrawSettingRequestAnalysisResultType,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';

type THandleFailedNotifyUpdateUserWithdrawSettingRequestIssueEventRequest =
  Pick<
    NotifyUserWithdrawSettingRequestIssue,
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
    | 'userWithdrawSettingRequestId'
    | 'summary'
    | 'analysisResult'
    | 'assigneeName'
    | 'creatorName'
    | 'reporterName'
  >;

export class HandleFailedNotifyUpdateUserWithdrawSettingRequestIssueEventRequest
  extends AutoValidator
  implements
    THandleFailedNotifyUpdateUserWithdrawSettingRequestIssueEventRequest
{
  @IsString()
  @Length(1, 255)
  issueId: string;

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

  @IsEnum(UserWithdrawSettingRequestState)
  status: UserWithdrawSettingRequestState;

  @IsString()
  @MaxLength(255)
  @SanitizeHtml()
  summary!: string;

  @IsUUID(4)
  userWithdrawSettingRequestId!: string;

  @IsOptional()
  @IsEnum(UserWithdrawSettingRequestAnalysisResultType)
  analysisResult?: UserWithdrawSettingRequestAnalysisResultType;

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
    props: THandleFailedNotifyUpdateUserWithdrawSettingRequestIssueEventRequest,
  ) {
    super(props);
  }
}

export class HandleFailedNotifyUpdateUserWithdrawSettingRequestIssueEventController {
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
    notifyIssueRepository: NotifyUserWithdrawSettingRequestIssueRepository,
  ) {
    this.logger = logger.child({
      context:
        HandleFailedNotifyUpdateUserWithdrawSettingRequestIssueEventController.name,
    });

    this.usecase = new UseCase(this.logger, notifyIssueRepository);
  }

  async execute(
    request: HandleFailedNotifyUpdateUserWithdrawSettingRequestIssueEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle failed issue event request.', { request });

    const notifyIssue = new NotifyUserWithdrawSettingRequestIssueEntity(
      request,
    );

    await this.usecase.execute(notifyIssue);
  }
}
