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
  NotifyWarningTransactionIssue,
  NotifyWarningTransactionIssueEntity,
  NotifyWarningTransactionIssueRepository,
} from '@zro/api-jira/domain';
import {
  WarningTransactionAnalysisResultType,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import {
  ComplianceService,
  HandleNotifyUpdateWarningTransactionIssueEventUseCase as UseCase,
} from '@zro/api-jira/application';

type THandleNotifyUpdateWarningTransactionIssueEventRequest = Pick<
  NotifyWarningTransactionIssue,
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
  | 'operationId'
  | 'summary'
  | 'analysisResult'
  | 'analysisDetails'
  | 'assigneeName'
  | 'creatorName'
  | 'reporterName'
>;

export class HandleNotifyUpdateWarningTransactionIssueEventRequest
  extends AutoValidator
  implements THandleNotifyUpdateWarningTransactionIssueEventRequest
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

  constructor(props: THandleNotifyUpdateWarningTransactionIssueEventRequest) {
    super(props);
  }
}

export class HandleNotifyUpdateWarningTransactionIssueEventController {
  /**
   * Handler triggered to create notify update warning transaction.
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
    notifyIssueRepository: NotifyWarningTransactionIssueRepository,
    complianceService: ComplianceService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyUpdateWarningTransactionIssueEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      notifyIssueRepository,
      complianceService,
    );
  }

  async execute(
    request: HandleNotifyUpdateWarningTransactionIssueEventRequest,
  ): Promise<void> {
    this.logger.debug(
      'Handle update warning transaction issue event request.',
      { request },
    );

    const notifyWarningTransactionIssue =
      new NotifyWarningTransactionIssueEntity(request);

    await this.usecase.execute(notifyWarningTransactionIssue);
  }
}
