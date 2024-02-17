import { DatabaseRepository } from '@zro/common';
import {
  Company,
  CompanyPolicy,
  CompanyPolicyRepository,
} from '@zro/pix-zro-pay/domain';
import { CompanyPolicyModel } from '@zro/pix-zro-pay/infrastructure';

export class CompanyPolicyDatabaseRepository
  extends DatabaseRepository
  implements CompanyPolicyRepository
{
  static toDomain(companyPolicyModel: CompanyPolicyModel): CompanyPolicy {
    return companyPolicyModel?.toDomain() ?? null;
  }

  async create(companyPolicy: CompanyPolicy): Promise<CompanyPolicy> {
    const companyPolicyGenerated =
      await CompanyPolicyModel.create<CompanyPolicyModel>(companyPolicy, {
        transaction: this.transaction,
      });

    companyPolicy.createdAt = companyPolicyGenerated.createdAt;
    return companyPolicy;
  }

  async update(companyPolicy: CompanyPolicy): Promise<CompanyPolicy> {
    await CompanyPolicyModel.update<CompanyPolicyModel>(companyPolicy, {
      where: { id: companyPolicy.id },
      transaction: this.transaction,
    });

    return companyPolicy;
  }

  async getById(id: number): Promise<CompanyPolicy> {
    return CompanyPolicyModel.findOne<CompanyPolicyModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(CompanyPolicyDatabaseRepository.toDomain);
  }

  async getByCompany(company: Company): Promise<CompanyPolicy> {
    return CompanyPolicyModel.findOne<CompanyPolicyModel>({
      where: {
        companyId: company.id,
      },
      transaction: this.transaction,
    }).then(CompanyPolicyDatabaseRepository.toDomain);
  }
}
