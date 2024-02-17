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
  Length,
} from 'class-validator';
import {
  ComplianceService,
  HandleNotifyUpdateUserWithdrawSettingRequestIssueEventUseCase as UseCase,
} from '@zro/api-jira/application';
import {
  NotifyUserWithdrawSettingRequestIssue,
  NotifyUserWithdrawSettingRequestIssueEntity,
  NotifyUserWithdrawSettingRequestIssueRepository,
} from '@zro/api-jira/domain';
import {
  UserWithdrawSettingRequestAnalysisResultType,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';

type THandleNotifyUpdateUserWithdrawSettingRequestIssueEventRequest = Pick<
  NotifyUserWithdrawSettingRequestIssue,
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
  | 'userWithdrawSettingRequestId'
  | 'summary'
  | 'analysisResult'
  | 'analysisDetails'
  | 'assigneeName'
  | 'creatorName'
  | 'reporterName'
>;

export class HandleNotifyUpdateUserWithdrawSettingRequestIssueEventRequest
  extends AutoValidator
  implements THandleNotifyUpdateUserWithdrawSettingRequestIssueEventRequest
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
  @IsString()
  @MaxLength(255)
  priorityName?: string;

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
  @MaxLength(2000)
  analysisDetails?: string;

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
    props: THandleNotifyUpdateUserWithdrawSettingRequestIssueEventRequest,
  ) {
    super(props);
  }
}

export class HandleNotifyUpdateUserWithdrawSettingRequestIssueEventController {
  /**
   * Handler triggered to create notify update user withdraw setting request.
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
    notifyIssueRepository: NotifyUserWithdrawSettingRequestIssueRepository,
    complianceService: ComplianceService,
  ) {
    this.logger = logger.child({
      context:
        HandleNotifyUpdateUserWithdrawSettingRequestIssueEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      notifyIssueRepository,
      complianceService,
    );
  }

  async execute(
    request: HandleNotifyUpdateUserWithdrawSettingRequestIssueEventRequest,
  ): Promise<void> {
    this.logger.debug(
      'Handle update user withdraw setting request issue event request.',
      { request },
    );

    const notifyUserWithdrawSettingRequestIssue =
      new NotifyUserWithdrawSettingRequestIssueEntity(request);

    await this.usecase.execute(notifyUserWithdrawSettingRequestIssue);
  }
}
