import { Logger } from 'winston';
import { IsEnum, IsIn, IsInt, IsPositive, ValidateIf } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  UserWithdrawSetting,
  UserWithdrawSettingRepository,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/utils/domain';
import {
  OperationService,
  PixKeyService,
  PixPaymentService,
  SyncUserWithdrawSettingUseCase as UseCase,
} from '@zro/utils/application';

export type TSyncUserWithdrawSettingRequest = {
  type: UserWithdrawSetting['type'];
  day?: UserWithdrawSetting['day'];
  weekDay?: UserWithdrawSetting['weekDay'];
};

export class SyncUserWithdrawSettingRequest
  extends AutoValidator
  implements TSyncUserWithdrawSettingRequest
{
  @IsEnum(WithdrawSettingType)
  type: WithdrawSettingType;

  @ValidateIf(
    (body: SyncUserWithdrawSettingRequest) =>
      body.type === WithdrawSettingType.MONTHLY,
  )
  @IsInt()
  @IsPositive()
  @IsIn([5, 15, 25])
  day?: number;

  @ValidateIf(
    (body: SyncUserWithdrawSettingRequest) =>
      body.type === WithdrawSettingType.WEEKLY,
  )
  @IsEnum(WithdrawSettingWeekDays)
  weekDay?: WithdrawSettingWeekDays;

  constructor(props: TSyncUserWithdrawSettingRequest) {
    super(props);
  }
}

export class SyncUserWithdrawSettingController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userWithdrawSettingRepository: UserWithdrawSettingRepository,
    operationService: OperationService,
    pixKeyService: PixKeyService,
    pixPaymentService: PixPaymentService,
    pixPaymentOperationCurrencyTag: string,
  ) {
    this.logger = logger.child({
      context: SyncUserWithdrawSettingController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      userWithdrawSettingRepository,
      operationService,
      pixKeyService,
      pixPaymentService,
      pixPaymentOperationCurrencyTag,
    );
  }

  async execute(request: SyncUserWithdrawSettingRequest): Promise<void> {
    this.logger.debug('Sync users withdraws settings.', { request });

    await this.usecase.execute(request);
  }
}
