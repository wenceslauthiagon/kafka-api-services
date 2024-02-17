// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { ReportUserConfigModel } from '@zro/reports/infrastructure';
import { ReportUserConfigEntity, TypeConfig } from '@zro/reports/domain';
import { PersonType } from '@zro/users/domain';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  type: PersonType.LEGAL_PERSON,
  description: faker.datatype.string(),
  typeConfig: TypeConfig.J,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * ReportUserConfig model factory.
 */
factory.define<ReportUserConfigModel>(
  ReportUserConfigModel.name,
  ReportUserConfigModel,
  () => fakerModel(),
);

/**
 * ReportUserConfig entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, ReportUserConfigEntity.name);

factory.define<ReportUserConfigEntity>(
  ReportUserConfigEntity.name,
  DefaultModel,
  fakerModel,
  {
    afterBuild: (model) => {
      return new ReportUserConfigEntity(model);
    },
  },
);

export const ReportUserConfigFactory = factory;
