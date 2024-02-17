import { Logger } from 'winston';
import {
  IsBoolean,
  IsEnum,
  IsString,
  IsUUID,
  IsPositive,
  IsOptional,
  MaxLength,
  Length,
  IsNumber,
} from 'class-validator';
import { AutoValidator, SanitizeHtml } from '@zro/common';
import { AccountType } from '@zro/pix-payments/domain';
import { HandleFailedNotifyCompletionTopazioEventUseCase as UseCase } from '@zro/api-topazio/application';
import {
  NotifyCompletion,
  NotifyCompletionEntity,
  NotifyCompletionRepository,
  StatusType,
} from '@zro/api-topazio/domain';
import {
  NotifyCompletionEventEmitterControllerInterface,
  NotifyCompletionEventEmitterController,
} from '@zro/api-topazio/interface';

type THandleFailedNotifyCompletionEventRequest = Pick<
  NotifyCompletion,
  | 'transactionId'
  | 'isDevolution'
  | 'status'
  | 'txId'
  | 'amount'
  | 'clientIspb'
  | 'clientBranch'
  | 'clientAccountNumber'
  | 'clientDocument'
  | 'clientName'
  | 'clientKey'
  | 'thirdPartIspb'
  | 'thirdPartBranch'
  | 'thirdPartAccountType'
  | 'thirdPartAccountNumber'
  | 'thirdPartDocument'
  | 'thirdPartName'
  | 'thirdPartKey'
  | 'endToEndId'
  | 'description'
>;

export class HandleFailedNotifyCompletionEventRequest
  extends AutoValidator
  implements THandleFailedNotifyCompletionEventRequest
{
  @IsUUID(4)
  transactionId: string;

  @IsBoolean()
  isDevolution: boolean;

  @IsEnum(StatusType)
  status: StatusType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  txId?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  @Length(8, 8)
  clientIspb?: string;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  clientBranch?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  clientAccountNumber?: string;

  @IsString()
  @IsOptional()
  @Length(11, 14)
  clientDocument?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  clientName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  clientKey?: string;

  @IsString()
  @IsOptional()
  @Length(8, 8)
  thirdPartIspb?: string;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  thirdPartBranch?: string;

  @IsEnum(AccountType)
  @IsOptional()
  thirdPartAccountType?: AccountType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartAccountNumber?: string;

  @IsString()
  @IsOptional()
  @Length(11, 14)
  thirdPartDocument?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  thirdPartKey?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endToEndId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(140)
  @SanitizeHtml()
  description?: string;

  constructor(props: THandleFailedNotifyCompletionEventRequest) {
    super(props);
  }
}

export class HandleFailedNotifyCompletionTopazioEventController {
  /**
   * Handler triggered to create notify completion.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    private logger: Logger,
    notifyCompletionRepository: NotifyCompletionRepository,
    eventEmitter: NotifyCompletionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyCompletionTopazioEventController.name,
    });

    const controllerEventEmitter = new NotifyCompletionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      notifyCompletionRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleFailedNotifyCompletionEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle failed completion event request.', { request });

    const notifyCompletion = new NotifyCompletionEntity(request);
    await this.usecase.execute(notifyCompletion);
  }
}
