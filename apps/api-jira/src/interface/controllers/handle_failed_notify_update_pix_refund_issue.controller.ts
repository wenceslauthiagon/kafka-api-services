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
import { HandleFailedNotifyUpdatePixRefundIssueEventUseCase as UseCase } from '@zro/api-jira/application';
import {
  NotifyPixRefundIssueEntity,
  NotifyPixRefundIssueRepository,
  NotifyPixRefundIssue,
} from '@zro/api-jira/domain';
import {
  PixRefundReason,
  PixRefundRejectionReason,
  PixRefundStatus,
} from '@zro/pix-payments/domain';
import {
  NotifyPixRefundIssueEventEmitterControllerInterface,
  NotifyPixRefundIssueEventEmitterController,
} from '@zro/api-jira/interface';

type THandleFailedNotifyUpdatePixRefundIssueEventRequest = Pick<
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

export class HandleFailedNotifyUpdatePixRefundIssueEventRequest
  extends AutoValidator
  implements THandleFailedNotifyUpdatePixRefundIssueEventRequest
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

  constructor(props: THandleFailedNotifyUpdatePixRefundIssueEventRequest) {
    super(props);
  }
}

export class HandleFailedNotifyUpdatePixRefundIssueEventController {
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
    notifyIssueRepository: NotifyPixRefundIssueRepository,
    eventEmitter: NotifyPixRefundIssueEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyUpdatePixRefundIssueEventController.name,
    });

    const controllerEventEmitter =
      new NotifyPixRefundIssueEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      notifyIssueRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleFailedNotifyUpdatePixRefundIssueEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle failed issue event request.', { request });

    const notifyIssue = new NotifyPixRefundIssueEntity(request);
    await this.usecase.execute(notifyIssue);
  }
}
