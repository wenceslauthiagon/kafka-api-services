// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { TaxEntity } from '@zro/quotations/domain';
import { TaxModel } from '@zro/quotations/infrastructure';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  name: faker.datatype.string(10),
  value: faker.datatype.number({ min: 1, max: 9999 }),
  format: `[VALUE]%`,
});

/**
 * Tax factory.
 */
factory.define<TaxModel>(TaxModel.name, TaxModel, () => fakerModel());

/**
 * Tax entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, TaxEntity.name);

factory.define<TaxEntity>(TaxEntity.name, DefaultModel, () => fakerModel(), {
  afterBuild: (model) => {
    return new TaxEntity(model);
  },
});

export const TaxFactory = factory;
