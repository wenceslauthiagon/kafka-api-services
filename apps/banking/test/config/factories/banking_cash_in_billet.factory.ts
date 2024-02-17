// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { BankingCashInBilletEntity } from '@zro/banking/domain';
import { UserEntity } from '@zro/users/domain';
import { BankingCashInBilletModel } from '@zro/banking/infrastructure';
import { UserFactory } from '@zro/test/users/config';
import { BankingCashInBilletStatus } from '@zro/banking/domain';

const createRandomCode = (numDigits: number) => {
  let code = '';
  while (numDigits != 0) {
    code += `${Math.floor(Math.random() * 9)}`;
    numDigits--;
  }
  return code;
};

const fakerModel = () => ({
  id: faker.datatype.number({ min: 1, max: 999 }),
  barCode: createRandomCode(44),
  number: createRandomCode(11),
  thirdPartyNumber: createRandomCode(15),
  typeableLine: createRandomCode(47),
  value: faker.datatype.number({ min: 1, max: 99999 }),
  base64Pdf: faker.datatype.string(),
  dueDate: faker.date.recent(),
  status: BankingCashInBilletStatus.PENDING,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * BankingCashInBillet model factory.
 */
factory.define<BankingCashInBilletModel>(
  BankingCashInBilletModel.name,
  BankingCashInBilletModel,
  () => ({
    ...fakerModel(),
    userId: faker.datatype.number({ min: 1, max: 999 }),
  }),
);

/**
 * BankingCashInBillet entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, BankingCashInBilletEntity.name);

factory.define<BankingCashInBilletEntity>(
  BankingCashInBilletEntity.name,
  DefaultModel,
  async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    return Object.assign({}, fakerModel(), { user });
  },
  {
    afterBuild: (model) => {
      return new BankingCashInBilletEntity(model);
    },
  },
);

export const BankingCashInBilletFactory = factory;
