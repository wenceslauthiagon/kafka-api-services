import { Logger } from 'winston';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  MaxLength,
  Length,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  NotifyClaim,
  NotifyClaimEntity,
  NotifyClaimRepository,
} from '@zro/api-topazio/domain';
import { PersonType } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';
import {
  KeyType,
  ClaimReasonType,
  ClaimStatusType,
  ClaimType,
} from '@zro/pix-keys/domain';
import { HandleFailedNotifyClaimTopazioEventUseCase as UseCase } from '@zro/api-topazio/application';
import {
  NotifyClaimEventEmitterController,
  NotifyClaimEventEmitterControllerInterface,
} from '@zro/api-topazio/interface';

type THandleFailedNotifyClaimTopazioEventRequest = Pick<
  NotifyClaim,
  | 'id'
  | 'externalId'
  | 'accountOpeningDate'
  | 'accountType'
  | 'branch'
  | 'accountNumber'
  | 'claimReason'
  | 'claimType'
  | 'document'
  | 'donation'
  | 'donorIspb'
  | 'requestIspb'
  | 'endCompleteDate'
  | 'endResolutionDate'
  | 'lastChangeDate'
  | 'ispb'
  | 'key'
  | 'keyType'
  | 'name'
  | 'personType'
  | 'status'
  | 'tradeName'
>;

export class HandleFailedNotifyClaimTopazioEventRequest
  extends AutoValidator
  implements THandleFailedNotifyClaimTopazioEventRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  externalId: string;

  @IsString()
  @MaxLength(77)
  key: string;

  @IsBoolean()
  donation: boolean;

  @IsEnum(ClaimStatusType)
  status: ClaimStatusType;

  @IsEnum(ClaimType)
  claimType: ClaimType;

  @IsOptional()
  @IsDateString()
  accountOpeningDate?: Date;

  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @IsOptional()
  @IsString()
  @Length(4, 4)
  branch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  accountNumber?: string;

  @IsOptional()
  @IsEnum(ClaimReasonType)
  claimReason?: ClaimReasonType;

  @IsOptional()
  @IsString()
  @Length(11, 14)
  document?: string;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  donorIspb?: string;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  requestIspb?: string;

  @IsOptional()
  @IsDateString()
  endCompleteDate?: Date;

  @IsOptional()
  @IsDateString()
  endResolutionDate?: Date;

  @IsOptional()
  @IsDateString()
  lastChangeDate?: Date;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  ispb?: string;

  @IsOptional()
  @IsEnum(KeyType)
  keyType?: KeyType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEnum(PersonType)
  personType?: PersonType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  tradeName?: string;

  constructor(props: THandleFailedNotifyClaimTopazioEventRequest) {
    super(props);
  }
}

export class HandleFailedNotifyClaimTopazioEventController {
  /**
   * Handler triggered to create claim.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    private logger: Logger,
    notifyClaimRepository: NotifyClaimRepository,
    eventEmitter: NotifyClaimEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyClaimTopazioEventController.name,
    });

    const controllerEventEmitter = new NotifyClaimEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      notifyClaimRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleFailedNotifyClaimTopazioEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle create claim event request.', { request });

    const notifyClaim = new NotifyClaimEntity(request);
    await this.usecase.execute(notifyClaim);
  }
}
