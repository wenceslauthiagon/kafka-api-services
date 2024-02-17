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
  PixInfractionStatus,
  PixInfractionType,
} from '@zro/pix-payments/domain';
import {
  HandleNotifyCreatePixInfractionIssueEventUseCase as UseCase,
  PixPaymentService,
} from '@zro/api-jira/application';

type THandleNotifyCreatePixInfractionIssueEventRequest = Pick<
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
>;

export class HandleNotifyCreatePixInfractionIssueEventRequest
  extends AutoValidator
  implements THandleNotifyCreatePixInfractionIssueEventRequest
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

  constructor(props: THandleNotifyCreatePixInfractionIssueEventRequest) {
    super(props);
  }
}

export class HandleNotifyCreatePixInfractionIssueEventController {
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
      context: HandleNotifyCreatePixInfractionIssueEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      notifyIssueRepository,
      pixPaymentService,
    );
  }

  async execute(
    request: HandleNotifyCreatePixInfractionIssueEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle create issue event request.', { request });

    const notifyCreatePixInfractionIssue = new NotifyPixInfractionIssueEntity(
      request,
    );
    await this.usecase.execute(notifyCreatePixInfractionIssue);
  }
}
