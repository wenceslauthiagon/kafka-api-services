// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  FeatureSetting,
  FeatureSettingEntity,
  FeatureSettingName,
  FeatureSettingState,
} from '@zro/utils/domain';
import { FeatureSettingModel } from '@zro/utils/infrastructure';

const fakerModel = (): Partial<FeatureSetting> => {
  return {
    id: faker.datatype.uuid(),
    name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
    state: FeatureSettingState.ACTIVE,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };
};

/**
 * Feature setting model factory.
 */
factory.define<FeatureSettingModel>(
  FeatureSettingModel.name,
  FeatureSettingModel,
  async () => {
    return fakerModel();
  },
);

/**
 * Feature setting entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, FeatureSettingEntity.name);

factory.define<FeatureSettingEntity>(
  FeatureSettingEntity.name,
  DefaultModel,
  async () => {
    return fakerModel();
  },
  {
    afterBuild: (model) => {
      return new FeatureSettingEntity(model);
    },
  },
);

export const FeatureSettingFactory = factory;
