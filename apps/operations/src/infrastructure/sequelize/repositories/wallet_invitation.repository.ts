import { Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
  getMoment,
} from '@zro/common';
import {
  TGetWalletInvitationsFilter,
  Wallet,
  WalletInvitation,
  WalletInvitationState,
  WalletInvitationRepository,
} from '@zro/operations/domain';
import { WalletInvitationModel } from '@zro/operations/infrastructure';
import { User } from '@zro/users/domain';

export class WalletInvitationDatabaseRepository
  extends DatabaseRepository
  implements WalletInvitationRepository
{
  /**
   * Convert WalletInvitation model to WalletInvitation domain.
   * @param WalletInvitation Model instance.
   * @returns Domain instance.
   */
  static toDomain(WalletInvitation: WalletInvitationModel): WalletInvitation {
    return WalletInvitation?.toDomain() ?? null;
  }

  async create(walletInvitation: WalletInvitation): Promise<WalletInvitation> {
    const walletInvitationGenerated =
      await WalletInvitationModel.create<WalletInvitationModel>(
        walletInvitation,
        { transaction: this.transaction },
      );

    walletInvitation.createdAt = walletInvitationGenerated.createdAt;
    return walletInvitation;
  }

  async update(walletInvitation: WalletInvitation): Promise<WalletInvitation> {
    await WalletInvitationModel.update<WalletInvitationModel>(
      walletInvitation,
      {
        where: { id: walletInvitation.id },
        transaction: this.transaction,
      },
    );

    return walletInvitation;
  }

  async getById(id: string): Promise<WalletInvitation> {
    return WalletInvitationModel.findOne<WalletInvitationModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(WalletInvitationDatabaseRepository.toDomain);
  }

  async getByIdAndUser(id: string, user: User): Promise<WalletInvitation> {
    return WalletInvitationModel.findOne<WalletInvitationModel>({
      where: {
        id,
        userId: user.uuid,
      },
      transaction: this.transaction,
    }).then(WalletInvitationDatabaseRepository.toDomain);
  }

  async getByUserAndFilter(
    pagination: Pagination,
    filter: TGetWalletInvitationsFilter,
    user: User,
  ): Promise<TPaginationResponse<WalletInvitation>> {
    return WalletInvitationModel.findAndCountAll({
      ...paginationWhere(pagination),
      where: {
        userId: user.uuid,
        ...this.mountDefaultFilter(filter),
        ...(filter.expiredAtPeriodStart &&
          filter.expiredAtPeriodEnd && {
            expiredAt: {
              [Op.between]: [
                getMoment(filter.expiredAtPeriodStart)
                  .startOf('day')
                  .toISOString(),
                getMoment(filter.expiredAtPeriodEnd).endOf('day').toISOString(),
              ],
            },
          }),
      },
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(WalletInvitationDatabaseRepository.toDomain),
      ),
    );
  }

  async getByEmailAndFilterAndNotExpired(
    pagination: Pagination,
    filter: TGetWalletInvitationsFilter,
    email: string,
  ): Promise<TPaginationResponse<WalletInvitation>> {
    return WalletInvitationModel.findAndCountAll({
      ...paginationWhere(pagination),
      where: {
        state: {
          [Op.not]: WalletInvitationState.EXPIRED,
        },
        email,
        ...this.mountDefaultFilter(filter),
      },
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(WalletInvitationDatabaseRepository.toDomain),
      ),
    );
  }

  async getByEmailNotExpired(email: string): Promise<WalletInvitation> {
    return WalletInvitationModel.findOne({
      where: {
        state: {
          [Op.not]: WalletInvitationState.EXPIRED,
        },
        email,
      },
      transaction: this.transaction,
    }).then(WalletInvitationDatabaseRepository.toDomain);
  }

  async getByEmailAndWalletAndStateIn(
    email: string,
    wallet: Wallet,
    states: WalletInvitationState[],
  ): Promise<WalletInvitation> {
    return WalletInvitationModel.findOne({
      where: {
        email,
        walletId: wallet.uuid,
        state: {
          [Op.in]: states,
        },
      },
      transaction: this.transaction,
    }).then(WalletInvitationDatabaseRepository.toDomain);
  }

  private mountDefaultFilter(filter: TGetWalletInvitationsFilter) {
    return {
      ...(filter.state ? { state: filter.state } : {}),
      ...(filter.acceptedAtPeriodStart &&
        filter.acceptedAtPeriodEnd && {
          acceptedAt: {
            [Op.between]: [
              getMoment(filter.acceptedAtPeriodStart)
                .startOf('day')
                .toISOString(),
              getMoment(filter.acceptedAtPeriodEnd).endOf('day').toISOString(),
            ],
          },
        }),
      ...(filter.declinedAtPeriodStart &&
        filter.declinedAtPeriodEnd && {
          declinedAt: {
            [Op.between]: [
              getMoment(filter.declinedAtPeriodStart)
                .startOf('day')
                .toISOString(),
              getMoment(filter.declinedAtPeriodEnd).endOf('day').toISOString(),
            ],
          },
        }),
      ...(filter.createdAtPeriodStart &&
        filter.createdAtPeriodEnd && {
          createdAt: {
            [Op.between]: [
              getMoment(filter.createdAtPeriodStart)
                .startOf('day')
                .toISOString(),
              getMoment(filter.createdAtPeriodEnd).endOf('day').toISOString(),
            ],
          },
        }),
    };
  }

  async getByExpiredAtLessThanAndStateIn(
    expiredAt: Date,
    states: WalletInvitationState[],
  ): Promise<WalletInvitation[]> {
    return WalletInvitationModel.findAll<WalletInvitationModel>({
      where: {
        expiredAt: { [Op.lt]: expiredAt },
        state: { [Op.in]: states },
      },
      transaction: this.transaction,
    }).then((data) => data.map(WalletInvitationDatabaseRepository.toDomain));
  }
}
