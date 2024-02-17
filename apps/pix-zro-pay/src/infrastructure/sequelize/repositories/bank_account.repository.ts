import { DatabaseRepository } from '@zro/common';
import { BankAccount, BankAccountRepository } from '@zro/pix-zro-pay/domain';
import { BankAccountModel } from '@zro/pix-zro-pay/infrastructure';

export class BankAccountDatabaseRepository
  extends DatabaseRepository
  implements BankAccountRepository
{
  static toDomain(bankAccountModel: BankAccountModel): BankAccount {
    return bankAccountModel?.toDomain() ?? null;
  }

  async create(bankAccount: BankAccount): Promise<BankAccount> {
    const bankAccountGenerated =
      await BankAccountModel.create<BankAccountModel>(bankAccount, {
        transaction: this.transaction,
      });

    bankAccount.createdAt = bankAccountGenerated.createdAt;
    return bankAccount;
  }

  async update(bankAccount: BankAccount): Promise<BankAccount> {
    await BankAccountModel.update<BankAccountModel>(bankAccount, {
      where: { id: bankAccount.id },
      transaction: this.transaction,
    });

    return bankAccount;
  }

  async getById(id: number): Promise<BankAccount> {
    return BankAccountModel.findOne<BankAccountModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(BankAccountDatabaseRepository.toDomain);
  }
}
