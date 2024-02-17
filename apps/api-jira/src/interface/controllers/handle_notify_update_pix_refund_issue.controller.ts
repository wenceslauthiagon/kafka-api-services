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
  NotifyPixRefundIssue,
  NotifyPixRefundIssueEntity,
  NotifyPixRefundIssueRepository,
} from '@zro/api-jira/domain';
import {
  PixRefundReason,
  PixRefundRejectionReason,
  PixRefundStatus,
} from '@zro/pix-payments/domain';
import {
  HandleNotifyUpdatePixRefundIssueEventUseCase as UseCase,
  PixPaymentService,
} from '@zro/api-jira/application';

type THandleNotifyUpdatePixRefundIssueEventRequest = Pick<
  NotifyPixRefundIssue,
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
  | 'description'
  | 'reason'
  | 'analysisDetails'
  | 'rejectionReason'
  | 'summary'
  | 'assigneeName'
  | 'creatorName'
  | 'reporterName'
>;

export class HandleNotifyUpdatePixRefundIssueEventRequest
  extends AutoValidator
  implements THandleNotifyUpdatePixRefundIssueEventRequest
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

  @IsEnum(PixRefundStatus)
  status: PixRefundStatus;

  @IsUUID(4)
  operationId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @SanitizeHtml()
  description?: string;

  @IsEnum(PixRefundReason)
  reason?: PixRefundReason;

  @IsOptional()
  @IsString()
  @MaxLength(1900)
  @SanitizeHtml()
  analysisDetails?: string;

  @IsOptional()
  @IsEnum(PixRefundRejectionReason)
  rejectionReason?: PixRefundRejectionReason;

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

  constructor(props: THandleNotifyUpdatePixRefundIssueEventRequest) {
    super(props);
  }
}

export class HandleNotifyUpdatePixRefundIssueEventController {
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
    notifyIssueRepository: NotifyPixRefundIssueRepository,
    pixPaymentService: PixPaymentService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyUpdatePixRefundIssueEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      notifyIssueRepository,
      pixPaymentService,
    );
  }

  async execute(
    request: HandleNotifyUpdatePixRefundIssueEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle update issue event request.', { request });

    const notifyUpdatePixRefundIssue = new NotifyPixRefundIssueEntity(request);
    await this.usecase.execute(notifyUpdatePixRefundIssue);
  }
}
