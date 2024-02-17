import { Transaction, Op } from 'sequelize';
import { DatabaseRepository, getMoment } from '@zro/common';
import { User } from '@zro/users/domain';
import { Bank } from '@zro/banking/domain';
import {
  DecodedPixAccount,
  DecodedPixAccountRepository,
  DecodedPixAccountState,
} from '@zro/pix-payments/domain';
import { DecodedPixAccountModel } from '@zro/pix-payments/infrastructure';

export class DecodedPixAccountDatabaseRepository
  extends DatabaseRepository
  implements DecodedPixAccountRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    pixDecodedAccountModel: DecodedPixAccountModel,
  ): DecodedPixAccount {
    return pixDecodedAccountModel?.toDomain() ?? null;
  }

  async create(
    pixDecodedAccount: DecodedPixAccount,
  ): Promise<DecodedPixAccount> {
    const createdDecodedAccount =
      await DecodedPixAccountModel.create<DecodedPixAccountModel>(
        pixDecodedAccount,
        {
          transaction: this.transaction,
        },
      );

    pixDecodedAccount.createdAt = createdDecodedAccount.createdAt;

    return pixDecodedAccount;
  }

  async getById(id: string): Promise<DecodedPixAccount> {
    return DecodedPixAccountModel.findOne<DecodedPixAccountModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(DecodedPixAccountDatabaseRepository.toDomain);
  }

  async getByDocumentAndAccountAndBranch(
    document: string,
    accountNumber: string,
    branch: string,
  ): Promise<DecodedPixAccount> {
    return DecodedPixAccountModel.findOne<DecodedPixAccountModel>({
      where: {
        document,
        accountNumber,
        branch,
      },
      transaction: this.transaction,
    }).then(DecodedPixAccountDatabaseRepository.toDomain);
  }

  async getByUserAndBankAndAccountAndBranch(
    user: User,
    bank: Bank,
    accountNumber: string,
    branch: string,
  ): Promise<DecodedPixAccount> {
    return DecodedPixAccountModel.findOne<DecodedPixAccountModel>({
      where: {
        userId: user.uuid,
        bankIspb: bank.ispb,
        accountNumber,
        branch,
      },
      transaction: this.transaction,
    }).then(DecodedPixAccountDatabaseRepository.toDomain);
  }

  async countByUserAndStatePendingLast24Hours(user: User): Promise<number> {
    return DecodedPixAccountModel.count<DecodedPixAccountModel>({
      where: {
        userId: user.uuid,
        state: DecodedPixAccountState.PENDING,
        createdAt: {
          [Op.gt]: getMoment().subtract(24, 'hours').toDate(),
        },
      },
      transaction: this.transaction,
    });
  }

  async update(
    decodedPixAccount: DecodedPixAccount,
  ): Promise<DecodedPixAccount> {
    await DecodedPixAccountModel.update<DecodedPixAccountModel>(
      decodedPixAccount,
      {
        where: { id: decodedPixAccount.id },
        transaction: this.transaction,
      },
    );

    return decodedPixAccount;
  }
}
