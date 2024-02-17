import { DatabaseRepository } from '@zro/common';
import {
  BankAccount,
  Company,
  CompanyRepository,
} from '@zro/pix-zro-pay/domain';
import { CompanyModel } from '@zro/pix-zro-pay/infrastructure';

export class CompanyDatabaseRepository
  extends DatabaseRepository
  implements CompanyRepository
{
  static toDomain(companyModel: CompanyModel): Company {
    return companyModel?.toDomain() ?? null;
  }

  async create(company: Company): Promise<Company> {
    const companyGenerated = await CompanyModel.create<CompanyModel>(company, {
      transaction: this.transaction,
    });

    company.createdAt = companyGenerated.createdAt;
    return company;
  }

  async update(company: Company): Promise<Company> {
    await CompanyModel.update<CompanyModel>(company, {
      where: { id: company.id },
      transaction: this.transaction,
    });

    return company;
  }

  async getById(id: number): Promise<Company> {
    return CompanyModel.findOne<CompanyModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(CompanyDatabaseRepository.toDomain);
  }

  async getByBankAccount(bankAccount: BankAccount): Promise<Company> {
    return CompanyModel.findOne<CompanyModel>({
      where: {
        activeBankForCashOutId: bankAccount.id,
      },
      transaction: this.transaction,
    }).then(CompanyDatabaseRepository.toDomain);
  }

  async getByIdAndXApiKey(id: number, xApiKey: string): Promise<Company> {
    return CompanyModel.findOne<CompanyModel>({
      where: {
        id,
        xApiKey,
      },
      transaction: this.transaction,
    }).then(CompanyDatabaseRepository.toDomain);
  }
}
