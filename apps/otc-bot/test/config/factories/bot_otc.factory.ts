// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  BotOtcControl,
  BotOtcEntity,
  BotOtcStatus,
  BotOtcType,
} from '@zro/otc-bot/domain';
import { StreamPairFactory } from '@zro/test/quotations/config';
import { StreamPairEntity } from '@zro/quotations/domain';
import { BotOtcModel } from '@zro/otc-bot/infrastructure';
import { ProviderFactory } from '@zro/test/otc/config';
import { ProviderEntity } from '@zro/otc/domain';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  name: 'TEST BOT',
  spread: 100,
  balance: faker.datatype.number({ min: 10000, max: 9999999 }),
  step: 10000,
  control: BotOtcControl.START,
  status: BotOtcStatus.RUNNING,
  type: BotOtcType.SPREAD,
});

/**
 * BotOtc model factory.
 */
factory.define<BotOtcModel>(BotOtcModel.name, BotOtcModel, () => ({
  ...fakerModel(),
  fromPairId: faker.datatype.uuid(),
  toPairId: faker.datatype.uuid(),
  fromProviderId: faker.datatype.uuid(),
  toProviderId: faker.datatype.uuid(),
}));

/**
 * BotOtc entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, BotOtcEntity.name);

factory.define<BotOtcEntity>(
  BotOtcEntity.name,
  DefaultModel,
  async () => {
    const fromPair = await StreamPairFactory.create<StreamPairEntity>(
      StreamPairEntity.name,
    );
    const toPair = await StreamPairFactory.create<StreamPairEntity>(
      StreamPairEntity.name,
    );
    const fromProvider = await ProviderFactory.create<ProviderEntity>(
      ProviderEntity.name,
    );
    const toProvider = await ProviderFactory.create<ProviderEntity>(
      ProviderEntity.name,
    );

    return { ...fakerModel(), fromPair, toPair, fromProvider, toProvider };
  },
  {
    afterBuild: (model) => {
      return new BotOtcEntity(model);
    },
  },
);

export const BotOtcFactory = factory;
