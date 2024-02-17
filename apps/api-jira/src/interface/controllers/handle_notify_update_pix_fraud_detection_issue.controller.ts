import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import {
  AutoValidator,
  IsIsoStringDateFormat,
  SanitizeHtml,
} from '@zro/common';
import {
  NotifyPixFraudDetectionIssue,
  NotifyPixFraudDetectionIssueEntity,
  NotifyPixFraudDetectionIssueRepository,
} from '@zro/api-jira/domain';
import {
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import {
  HandleNotifyUpdatePixFraudDetectionIssueEventUseCase as UseCase,
  PixPaymentService,
} from '@zro/api-jira/application';

type THandleNotifyUpdatePixFraudDetectionIssueEventRequest = Pick<
  NotifyPixFraudDetectionIssue,
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
  | 'summary'
  | 'assigneeName'
  | 'creatorName'
  | 'reporterName'
  | 'issueCreatedAt'
  | 'document'
  | 'fraudType'
  | 'key'
>;

export class HandleNotifyUpdatePixFraudDetectionIssueEventRequest
  extends AutoValidator
  implements THandleNotifyUpdatePixFraudDetectionIssueEventRequest
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

  @IsEnum(PixFraudDetectionStatus)
  status: PixFraudDetectionStatus;

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

  @IsString()
  @Length(11, 14)
  document: string;

  @IsEnum(PixFraudDetectionType)
  fraudType: PixFraudDetectionType;

  @IsOptional()
  @IsString()
  key?: string;

  constructor(props: THandleNotifyUpdatePixFraudDetectionIssueEventRequest) {
    super(props);
  }
}

export class HandleNotifyUpdatePixFraudDetectionIssueEventController {
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
    notifyIssueRepository: NotifyPixFraudDetectionIssueRepository,
    pixPaymentService: PixPaymentService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyUpdatePixFraudDetectionIssueEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      notifyIssueRepository,
      pixPaymentService,
    );
  }

  async execute(
    request: HandleNotifyUpdatePixFraudDetectionIssueEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle update issue event request.', { request });

    const notifyUpdatePixFraudDetectionIssue =
      new NotifyPixFraudDetectionIssueEntity(request);
    await this.usecase.execute(notifyUpdatePixFraudDetectionIssue);
  }
}
