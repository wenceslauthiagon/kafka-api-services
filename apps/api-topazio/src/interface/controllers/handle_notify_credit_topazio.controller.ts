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
  IsInt,
} from 'class-validator';
import { AutoValidator, TranslateService } from '@zro/common';
import { AccountType } from '@zro/pix-payments/domain';
import {
  NotifyCredit,
  NotifyCreditEntity,
  NotifyCreditRepository,
  OperationType,
  TransactionType,
  StatusType,
  FailedNotifyCreditRepository,
} from '@zro/api-topazio/domain';
import {
  HandleNotifyCreditTopazioEventUseCase as UseCase,
  PixPaymentService,
} from '@zro/api-topazio/application';

type THandleNotifyCreditTopazioEventRequest = Pick<
  NotifyCredit,
  | 'transactionId'
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

export class HandleNotifyCreditTopazioEventRequest
  extends AutoValidator
  implements THandleNotifyCreditTopazioEventRequest
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

  @IsInt()
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

  @IsOptional()
  @IsEnum(AccountType)
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
  description?: string;

  constructor(props: THandleNotifyCreditTopazioEventRequest) {
    super(props);
  }
}

export class HandleNotifyCreditTopazioEventController {
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
    pixPaymentService: PixPaymentService,
    failedNotifyCreditRepository: FailedNotifyCreditRepository,
    translateService: TranslateService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyCreditTopazioEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      notifyCreditRepository,
      pixPaymentService,
      failedNotifyCreditRepository,
      translateService,
    );
  }

  async execute(request: HandleNotifyCreditTopazioEventRequest): Promise<void> {
    this.logger.debug('Handle create credit event request.', { request });

    const notifyCredit = new NotifyCreditEntity(request);
    await this.usecase.execute(notifyCredit);
  }
}
