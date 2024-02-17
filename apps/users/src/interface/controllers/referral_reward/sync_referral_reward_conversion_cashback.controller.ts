import { Logger } from 'winston';
import { IsDefined } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  OnboardingRepository,
  ReferralRewardRepository,
} from '@zro/users/domain';
import {
  SyncReferralRewardConversionCashbackUseCase as UseCase,
  OtcService,
  OperationService,
} from '@zro/users/application';

type TSyncReferralRewardConversionCashbackRequest = {
  baseCurrency: Currency;
  amountCurrency: Currency;
};

export class SyncReferralRewardConversionCashbackRequest
  extends AutoValidator
  implements TSyncReferralRewardConversionCashbackRequest
{
  @IsDefined()
  baseCurrency: Currency;

  @IsDefined()
  amountCurrency: Currency;
}

export class SyncReferralRewardConversionCashbackController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param referralRewardRepository Referral rewardRepository repository.
   */
  constructor(
    private logger: Logger,
    referralRewardRepository: ReferralRewardRepository,
    onboardingRepository: OnboardingRepository,
    otcService: OtcService,
    operationService: OperationService,
    cashbackOperationTransactionTag: string,
    referralRewardIntervalStartDays: number,
    referralRewardIntervalEndDays: number,
    affiliateSizeMinimum: number,
  ) {
    this.logger = logger.child({
      context: SyncReferralRewardConversionCashbackController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      referralRewardRepository,
      onboardingRepository,
      otcService,
      operationService,
      cashbackOperationTransactionTag,
      referralRewardIntervalStartDays,
      referralRewardIntervalEndDays,
      affiliateSizeMinimum,
    );
  }

  async execute(
    request: SyncReferralRewardConversionCashbackRequest,
  ): Promise<void> {
    this.logger.debug(
      'Sync pending referral reward conversion cashback request.',
      { request },
    );

    const { baseCurrency, amountCurrency } = request;

    await this.usecase.execute(baseCurrency, amountCurrency);
  }
}
