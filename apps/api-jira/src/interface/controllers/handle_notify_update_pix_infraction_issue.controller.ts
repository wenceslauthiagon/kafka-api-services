import { Logger } from 'winston';
import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsString,
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
import {
  NotifyPixInfractionIssue,
  NotifyPixInfractionIssueEntity,
  NotifyPixInfractionIssueRepository,
} from '@zro/api-jira/domain';
import {
  PixInfractionAnalysisResultType,
  PixInfractionStatus,
  PixInfractionType,
} from '@zro/pix-payments/domain';
import {
  HandleNotifyUpdatePixInfractionIssueEventUseCase as UseCase,
  PixPaymentService,
} from '@zro/api-jira/application';

type THandleNotifyUpdatePixInfractionIssueEventRequest = Pick<
  NotifyPixInfractionIssue,
  | 'issueId'
  | 'issueTypeId'
  | 'issueTypeName'
  | 'projectId'
  | 'projectKey'
  | 'projectName'
  | 'priorityId'
  | 'priorityName'
  | 'statusId'
  | 'status'
  | 'operationId'
  | 'description'
  | 'infractionType'
  | 'summary'
  | 'assigneeName'
  | 'creatorName'
  | 'reporterName'
  | 'issueCreatedAt'
  | 'analysisResult'
  | 'analysisDetails'
>;

export class HandleNotifyUpdatePixInfractionIssueEventRequest
  extends AutoValidator
  implements THandleNotifyUpdatePixInfractionIssueEventRequest
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

  @IsEnum(PixInfractionStatus)
  status: PixInfractionStatus;

  @IsUUID(4)
  operationId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @SanitizeHtml()
  description?: string;

  @IsEnum(PixInfractionType)
  infractionType!: PixInfractionType;

  @IsString()
  @MaxLength(255)
  @SanitizeHtml()
  summary!: string;

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

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format issueCreatedAt',
  })
  issueCreatedAt: Date;

  @IsOptional()
  @IsEnum(PixInfractionAnalysisResultType)
  analysisResult?: PixInfractionAnalysisResultType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  analysisDetails?: string;

  constructor(props: THandleNotifyUpdatePixInfractionIssueEventRequest) {
    super(props);
  }
}

export class HandleNotifyUpdatePixInfractionIssueEventController {
  /**
   * Handler triggered to create notify completion.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param notifyIssueRepository Notify Issue repository.
   * @param pixPaymentService Payment Service.
   */
  constructor(
    private logger: Logger,
    notifyIssueRepository: NotifyPixInfractionIssueRepository,
    pixPaymentService: PixPaymentService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyUpdatePixInfractionIssueEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      notifyIssueRepository,
      pixPaymentService,
    );
  }

  async execute(
    request: HandleNotifyUpdatePixInfractionIssueEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle update issue event request.', { request });

    const notifyUpdatePixInfractionIssue = new NotifyPixInfractionIssueEntity(
      request,
    );
    await this.usecase.execute(notifyUpdatePixInfractionIssue);
  }
}
