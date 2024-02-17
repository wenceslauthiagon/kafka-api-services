import { Op } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { ReferralReward, ReferralRewardRepository } from '@zro/users/domain';
import { ReferralRewardModel } from '@zro/users/infrastructure';

export class ReferralRewardDatabaseRepository
  extends DatabaseRepository
  implements ReferralRewardRepository
{
  static toDomain(addressModel: ReferralRewardModel): ReferralReward {
    return addressModel?.toDomain() ?? null;
  }

  async create(referralReward: ReferralReward): Promise<ReferralReward> {
    const createdReferralReward =
      await ReferralRewardModel.create<ReferralRewardModel>(referralReward, {
        transaction: this.transaction,
      });

    referralReward.id = createdReferralReward.id;
    referralReward.createdAt = createdReferralReward.createdAt;

    return referralReward;
  }

  async update(referralReward: ReferralReward): Promise<ReferralReward> {
    await ReferralRewardModel.update(referralReward, {
      where: { id: referralReward.id },
      transaction: this.transaction,
    });

    return referralReward;
  }

  async getByPaymentOperationIsNull(): Promise<ReferralReward[]> {
    return ReferralRewardModel.findAll({
      where: { paymentOperationId: null },
      transaction: this.transaction,
    }).then((result) => result.map(ReferralRewardDatabaseRepository.toDomain));
  }

  async getByPaymentOperationIsNullAndCreatedAtStartAndCreatedAtEnd(
    createdAtStart: Date,
    createdAtEnd: Date,
  ): Promise<ReferralReward[]> {
    return ReferralRewardModel.findAll({
      where: {
        paymentOperationId: null,
        createdAt: {
          [Op.between]: [createdAtStart, createdAtEnd],
        },
      },
      transaction: this.transaction,
    }).then((result) => result.map(ReferralRewardDatabaseRepository.toDomain));
  }

  async getById(id: number): Promise<ReferralReward> {
    return ReferralRewardModel.findOne<ReferralRewardModel>({
      where: { id },
      transaction: this.transaction,
    }).then(ReferralRewardDatabaseRepository.toDomain);
  }
}
