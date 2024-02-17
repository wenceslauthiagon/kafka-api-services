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
import { HandleFailedNotifyUpdatePixInfractionIssueEventUseCase as UseCase } from '@zro/api-jira/application';
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
  NotifyPixInfractionIssueEventEmitterControllerInterface,
  NotifyPixInfractionIssueEventEmitterController,
} from '@zro/api-jira/interface';

type THandleFailedNotifyUpdatePixInfractionIssueEventRequest = Pick<
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

export class HandleFailedNotifyUpdatePixInfractionIssueEventRequest
  extends AutoValidator
  implements THandleFailedNotifyUpdatePixInfractionIssueEventRequest
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

  constructor(props: THandleFailedNotifyUpdatePixInfractionIssueEventRequest) {
    super(props);
  }
}

export class HandleFailedNotifyUpdatePixInfractionIssueEventController {
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
    notifyIssueRepository: NotifyPixInfractionIssueRepository,
    eventEmitter: NotifyPixInfractionIssueEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyUpdatePixInfractionIssueEventController.name,
    });

    const controllerEventEmitter =
      new NotifyPixInfractionIssueEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      notifyIssueRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleFailedNotifyUpdatePixInfractionIssueEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle failed issue event request.', { request });

    const notifyIssue = new NotifyPixInfractionIssueEntity(request);
    await this.usecase.execute(notifyIssue);
  }
}
