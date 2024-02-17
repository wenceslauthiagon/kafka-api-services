import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import {
  FeatureSetting,
  FeatureSettingName,
  FeatureSettingRepository,
} from '@zro/utils/domain';
import { FeatureSettingModel } from '@zro/utils/infrastructure';

export class FeatureSettingDatabaseRepository
  extends DatabaseRepository
  implements FeatureSettingRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }
  static toDomain(featureSetting: FeatureSettingModel): FeatureSetting {
    return featureSetting?.toDomain() ?? null;
  }

  async create(featureSetting: FeatureSetting): Promise<FeatureSetting> {
    const createdFeatureSetting =
      await FeatureSettingModel.create<FeatureSettingModel>(featureSetting, {
        transaction: this.transaction,
      });

    createdFeatureSetting.id = createdFeatureSetting.id;
    createdFeatureSetting.createdAt = createdFeatureSetting.createdAt;
    createdFeatureSetting.updatedAt = createdFeatureSetting.updatedAt;

    return createdFeatureSetting;
  }

  async update(featureSetting: FeatureSetting): Promise<FeatureSetting> {
    await FeatureSettingModel.update<FeatureSettingModel>(featureSetting, {
      where: { id: featureSetting.id },
      transaction: this.transaction,
    });

    return featureSetting;
  }

  async getByName(name: FeatureSettingName): Promise<FeatureSetting> {
    return FeatureSettingModel.findOne<FeatureSettingModel>({
      where: { name },
      transaction: this.transaction,
    }).then(FeatureSettingDatabaseRepository.toDomain);
  }

  async getById(id: string): Promise<FeatureSetting> {
    return FeatureSettingModel.findOne<FeatureSettingModel>({
      where: { id },
      transaction: this.transaction,
    }).then(FeatureSettingDatabaseRepository.toDomain);
  }
}
