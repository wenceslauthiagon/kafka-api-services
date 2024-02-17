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
  NotifyCredit,
  NotifyCreditEntity,
  NotifyCreditRepository,
  OperationType,
  TransactionType,
  StatusType,
} from '@zro/api-topazio/domain';
import { HandleFailedNotifyCreditTopazioEventUseCase as UseCase } from '@zro/api-topazio/application';
import {
  NotifyCreditEventEmitterController,
  NotifyCreditEventEmitterControllerInterface,
} from '@zro/api-topazio/interface';

type THandleFailedNotifyCreditTopazioEventRequest = Pick<
  NotifyCredit,
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
  | 'endToEndId'
  | 'description'
>;

export class HandleFailedNotifyCreditTopazioEventRequest
  extends AutoValidator
  implements THandleFailedNotifyCreditTopazioEventRequest
{
  @IsUUID(4)
  transactionId: string;

  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @IsBoolean()
  isDevolution: boolean;

  @IsEnum(StatusType)
  status: StatusType;

  @IsEnum(OperationType)
  @IsOptional()
  operation?: OperationType;

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
  @MaxLength(255)
  endToEndId?: string;

  @IsString()
  @IsOptional()
  @SanitizeHtml()
  @MaxLength(140)
  description?: string;

  constructor(props: THandleFailedNotifyCreditTopazioEventRequest) {
    super(props);
  }
}

export class HandleFailedNotifyCreditTopazioEventController {
  /**
   * Handler triggered to create notify Credit.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    private logger: Logger,
    notifyCreditRepository: NotifyCreditRepository,
    eventEmitter: NotifyCreditEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyCreditTopazioEventController.name,
    });

    const controllerEventEmitter = new NotifyCreditEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      notifyCreditRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleFailedNotifyCreditTopazioEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle create debit event request.', { request });

    const notifyCredit = new NotifyCreditEntity(request);
    await this.usecase.execute(notifyCredit);
  }
}
