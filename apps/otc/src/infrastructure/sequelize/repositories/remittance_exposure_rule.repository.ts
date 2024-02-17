import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
} from '@zro/common';
import {
  RemittanceExposureRule,
  RemittanceExposureRuleRepository,
} from '@zro/otc/domain';
import { RemittanceExposureRuleModel } from '@zro/otc/infrastructure';
import { Currency } from '@zro/operations/domain';

export class RemittanceExposureRuleDatabaseRepository
  extends DatabaseRepository
  implements RemittanceExposureRuleRepository
{
  static toDomain(model: RemittanceExposureRuleModel): RemittanceExposureRule {
    return model?.toDomain() ?? null;
  }

  async create(
    remittanceExposureRule: RemittanceExposureRule,
  ): Promise<RemittanceExposureRule> {
    const createdRemittanceExposureRule =
      await RemittanceExposureRuleModel.create<RemittanceExposureRuleModel>(
        remittanceExposureRule,
        { transaction: this.transaction },
      );

    remittanceExposureRule.id = createdRemittanceExposureRule.id;
    remittanceExposureRule.createdAt = createdRemittanceExposureRule.createdAt;
    remittanceExposureRule.updatedAt = createdRemittanceExposureRule.updatedAt;

    return remittanceExposureRule;
  }

  async update(
    remittanceExposureRule: RemittanceExposureRule,
  ): Promise<RemittanceExposureRule> {
    await RemittanceExposureRuleModel.update<RemittanceExposureRuleModel>(
      remittanceExposureRule,
      {
        where: { id: remittanceExposureRule.id },
        transaction: this.transaction,
      },
    );

    return remittanceExposureRule;
  }

  async getByCurrency(currency: Currency): Promise<RemittanceExposureRule> {
    return RemittanceExposureRuleModel.findOne<RemittanceExposureRuleModel>({
      where: {
        currencyId: currency.id,
      },
      transaction: this.transaction,
    }).then(RemittanceExposureRuleDatabaseRepository.toDomain);
  }

  async getAll(
    pagination: Pagination,
    currency?: Currency,
  ): Promise<TPaginationResponse<RemittanceExposureRule>> {
    return RemittanceExposureRuleModel.findAndCountAll<RemittanceExposureRuleModel>(
      {
        where: {
          ...(currency?.id && { currencyId: currency.id }),
        },
        ...paginationWhere(pagination),
        transaction: this.transaction,
      },
    ).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(RemittanceExposureRuleDatabaseRepository.toDomain),
      ),
    );
  }

  async getById(id: string): Promise<RemittanceExposureRule> {
    return RemittanceExposureRuleModel.findOne<RemittanceExposureRuleModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(RemittanceExposureRuleDatabaseRepository.toDomain);
  }
}
