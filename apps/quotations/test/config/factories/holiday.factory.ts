// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel, getMoment } from '@zro/common';
import {
  HolidayEntity,
  HolidayLevel,
  HolidayType,
} from '@zro/quotations/domain';
import { HolidayModel } from '@zro/quotations/infrastructure';

const fakerModel = () => {
  const endDate = faker.date.recent(20);
  return {
    id: faker.datatype.uuid(),
    startDate: getMoment(endDate).subtract(10, 'seconds').toDate(),
    endDate,
    name: faker.datatype.string(15),
    type: HolidayType.HOLIDAY,
    level: HolidayLevel.NATIONAL,
    createdAt: faker.date.recent(),
  };
};

/**
 * Holiday factory.
 */
factory.define<HolidayModel>(HolidayModel.name, HolidayModel, () => {
  return fakerModel();
});

/**
 * Holiday entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, HolidayEntity.name);

factory.define<HolidayEntity>(
  HolidayEntity.name,
  DefaultModel,
  () => {
    return fakerModel();
  },
  {
    afterBuild: (model) => {
      return new HolidayEntity(model);
    },
  },
);

export const HolidayFactory = factory;
