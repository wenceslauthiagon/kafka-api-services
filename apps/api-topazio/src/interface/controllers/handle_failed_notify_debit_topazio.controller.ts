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
import {
  NotifyDebit,
  NotifyDebitEntity,
  NotifyDebitRepository,
  OperationType,
  TransactionType,
  StatusType,
} from '@zro/api-topazio/domain';
import { HandleFailedNotifyDebitTopazioEventUseCase as UseCase } from '@zro/api-topazio/application';
import {
  NotifyDebitEventEmitterController,
  NotifyDebitEventEmitterControllerInterface,
} from '@zro/api-topazio/interface';

type THandleFailedNotifyDebitTopazioEventRequest = Pick<
  NotifyDebit,
  | 'transactionId'
  | 'transactionType'
  | 'isDevolution'
  | 'operation'
  | 'status'
  | 'statusMessage'
  | 'transactionOriginalID'
  | 'reason'
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
  | 'description'
>;

export class HandleFailedNotifyDebitTopazioEventRequest
  extends AutoValidator
  implements THandleFailedNotifyDebitTopazioEventRequest
{
  @IsUUID(4)
  transactionId: string;

  @IsEnum(TransactionType)
  @IsOptional()
  transactionType?: TransactionType;

  @IsBoolean()
  @IsOptional()
  isDevolution?: boolean;

  @IsEnum(OperationType)
  @IsOptional()
  operation?: OperationType;

  @IsEnum(StatusType)
  @IsOptional()
  status?: StatusType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  statusMessage?: string;

  @IsUUID(4)
  @IsOptional()
  transactionOriginalID?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  reason?: string;

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
  @SanitizeHtml()
  @MaxLength(140)
  description?: string;

  constructor(props: THandleFailedNotifyDebitTopazioEventRequest) {
    super(props);
  }
}

export class HandleFailedNotifyDebitTopazioEventController {
  /**
   * Handler triggered to create notify Debit.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    private logger: Logger,
    notifyDebitRepository: NotifyDebitRepository,
    eventEmitter: NotifyDebitEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyDebitTopazioEventController.name,
    });

    const controllerEventEmitter = new NotifyDebitEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      notifyDebitRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleFailedNotifyDebitTopazioEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle create debit event request.', { request });

    const notifyDebit = new NotifyDebitEntity(request);
    await this.usecase.execute(notifyDebit);
  }
}
