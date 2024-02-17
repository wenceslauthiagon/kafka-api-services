import { DatabaseRepository } from '@zro/common';
import {
  BankingAccountContact,
  BankingAccountContactRepository,
  BankingContact,
} from '@zro/banking/domain';
import { BankingAccountContactModel } from '@zro/banking/infrastructure';

export class BankingAccountContactDatabaseRepository
  extends DatabaseRepository
  implements BankingAccountContactRepository
{
  static toDomain(
    bankModel: BankingAccountContactModel,
  ): BankingAccountContact {
    return bankModel?.toDomain() ?? null;
  }

  async create(
    bankingAccountContact: BankingAccountContact,
  ): Promise<BankingAccountContact> {
    return BankingAccountContactModel.create<BankingAccountContactModel>(
      bankingAccountContact,
      { transaction: this.transaction },
    ).then(BankingAccountContactDatabaseRepository.toDomain);
  }

  async getById(id: number): Promise<BankingAccountContact> {
    return BankingAccountContactModel.findOne<BankingAccountContactModel>({
      where: { id },
      transaction: this.transaction,
    }).then(BankingAccountContactDatabaseRepository.toDomain);
  }

  async getByBankingContact(
    bankingContact: BankingContact,
  ): Promise<BankingAccountContact[]> {
    return BankingAccountContactModel.findAll<BankingAccountContactModel>({
      where: { bankingContactId: bankingContact.id },
      transaction: this.transaction,
    }).then((bankingAccountContacts) =>
      bankingAccountContacts.map(
        BankingAccountContactDatabaseRepository.toDomain,
      ),
    );
  }

  async delete(bankingAccountContact: BankingAccountContact): Promise<number> {
    return BankingAccountContactModel.destroy({
      where: { id: bankingAccountContact.id },
      transaction: this.transaction,
    });
  }
}
