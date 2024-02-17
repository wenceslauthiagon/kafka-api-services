import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException, getMoment } from '@zro/common';
import {
  OnboardingRepository,
  PersonType,
  ReferralReward,
  ReferralRewardEntity,
  ReferralRewardRepository,
} from '@zro/users/domain';
import { Currency } from '@zro/operations/domain';
import { OperationService, OtcService } from '@zro/users/application';
import { QuotationAmountUnderMinAmountException } from '@zro/quotations/application';
import {
  WalletNotActiveException,
  WalletNotFoundException,
} from '@zro/operations/application';

type TReferralRewardsGroupByUser = Record<
  ReferralReward['awardedTo']['uuid'],
  Pick<ReferralReward, 'awardedTo' | 'group' | 'amount'> & {
    items: ReferralReward[];
  }
>;

export class SyncReferralRewardConversionCashbackUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param referralRewardRepository Referral reward repository.
   */
  constructor(
    private logger: Logger,
    private readonly referralRewardRepository: ReferralRewardRepository,
    private readonly onboardingRepository: OnboardingRepository,
    private readonly otcService: OtcService,
    private readonly operationService: OperationService,
    private readonly cashbackOperationTransactionTag: string,
    private readonly referralRewardIntervalStartDays: number,
    private readonly referralRewardIntervalEndDays: number,
    private readonly affiliateSizeMinimum: number,
  ) {
    this.logger = logger.child({
      context: SyncReferralRewardConversionCashbackUseCase.name,
    });
  }

  /**
   * Verify all pending referral reward and create cashback for them.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    baseCurrency: Currency,
    amountCurrency: Currency,
  ): Promise<void> {
    // Data input check.
    if (!baseCurrency?.symbol || !amountCurrency?.symbol) {
      throw new MissingDataException([
        ...(!baseCurrency?.symbol ? ['Base Currency'] : []),
        ...(!amountCurrency?.symbol ? ['Amount Currency'] : []),
      ]);
    }

    // Get the interval date of day from referralReward and the previous day of today
    const startDate = getMoment()
      .startOf('day')
      .subtract(this.referralRewardIntervalStartDays, 'day');
    const endDate = getMoment()
      .endOf('day')
      .subtract(this.referralRewardIntervalEndDays, 'day');

    // Search referralReward
    const referralRewardsFound =
      await this.referralRewardRepository.getByPaymentOperationIsNullAndCreatedAtStartAndCreatedAtEnd(
        startDate.toDate(),
        endDate.toDate(),
      );

    this.logger.debug('Referral reward length found.', {
      referralRewards: referralRewardsFound.length,
    });

    if (!referralRewardsFound?.length) return;

    // Group by awardedTo or group when it has a group.
    const referralRewardsGroupByUser =
      referralRewardsFound.reduce<TReferralRewardsGroupByUser>((acc, item) => {
        // Sanitize check
        if (!item.awardedTo?.uuid) return acc;

        // If it has a group, it keeps the groupId as a key
        // because a group needs to keep the same items.
        const key = item.group ?? item.awardedTo.uuid;

        // Initial value.
        if (!acc[key]) {
          acc[key] = {
            group: item.group ?? uuidV4(), // If it has no group, it gets a new groupId.
            awardedTo: item.awardedTo,
            amount: 0,
            items: [],
          };
        }

        acc[key].amount += item.amount;
        acc[key].items.push(item);
        return acc;
      }, {});

    if (!Object.values(referralRewardsGroupByUser).length) return;

    this.logger.debug('Referral reward group by awardedTo.', {
      referralRewards: referralRewardsGroupByUser,
    });

    // Get number of affiliates to filter referral rewards list which has enough natural person affiliates.
    const filteredReferralRewards = (
      await Promise.all(
        Object.values(referralRewardsGroupByUser).map(async (referral) => {
          // Get number of affiliates
          const affiliateLength =
            await this.onboardingRepository.countByReferredByAndAffiliateTypeAndStatusIsFinished(
              referral.awardedTo,
              PersonType.NATURAL_PERSON,
            );

          // Check if referral user has enough affiliates.
          if (affiliateLength < this.affiliateSizeMinimum) {
            this.logger.debug('ReferralUser does not have enough affiliates.', {
              affiliateLength,
            });
            return null;
          }

          return referral;
        }),
      )
    ).filter((i) => i);
    if (!filteredReferralRewards.length) return;

    // Update the referralReward which has no group with new groupId.
    const referralRewardsByGroup = await Promise.all(
      filteredReferralRewards.map(async (referralGroup) => {
        const { group, items } = referralGroup;
        referralGroup.items = await Promise.all(
          items.map((item) =>
            !item.group
              ? this.referralRewardRepository.update({ ...item, group })
              : item,
          ),
        );
        return referralGroup;
      }),
    );

    // Create cashback by groupId as cashbackId, because if a group alread has cashback,
    // OtcService returns the cashback already created before.
    for (const referralGroup of referralRewardsByGroup) {
      const { amount, awardedTo, group, items } = referralGroup;

      try {
        const wallet =
          await this.operationService.getWalletByUserAndDefaultIsTrue(
            awardedTo,
          );

        // Check if default wallet exists.
        if (!wallet) {
          this.logger.debug('Wallet not found.', { wallet });
          throw new WalletNotFoundException({ user: awardedTo });
        }
        if (!wallet.isActive()) {
          this.logger.debug('Wallet not active.', { wallet });
          throw new WalletNotActiveException({ state: wallet.state });
        }

        const cashback = await this.otcService.createCashback(
          group,
          awardedTo,
          wallet,
          baseCurrency,
          amountCurrency,
          amount,
          this.cashbackOperationTransactionTag,
        );

        // Update referralReward with cashback operation.
        await Promise.all(
          items.map(async (item) => {
            const referralReward = new ReferralRewardEntity({
              ...item,
              paymentOperation: cashback.conversion.operation,
            });
            return this.referralRewardRepository.update(referralReward);
          }),
        );
      } catch (error) {
        if (error instanceof QuotationAmountUnderMinAmountException) {
          this.logger.debug('Quotation amount is not enough.', { items });

          // When the quotation amount is not enough, the referralReward group needs
          // to be reset and change the items to retry with new group items.
          await Promise.all(
            items.map(async (item) => {
              const referralReward = new ReferralRewardEntity({
                ...item,
                group: null,
              });

              return this.referralRewardRepository.update(referralReward);
            }),
          );
        } else {
          this.logger.error('ERROR sync pending referralReward.', {
            code: error.code,
            stack: error.stack,
          });
          // FIXME: Should notify IT team.
        }
      }
    }

    this.logger.debug('Pending referralReward updated.');
  }
}
