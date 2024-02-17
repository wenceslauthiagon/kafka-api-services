// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { v4 as uuidV4 } from 'uuid';
import { DefaultModel } from '@zro/common/test';
import {
  KeyState,
  PixKeyEntity,
  PixKeyHistoryEntity,
} from '@zro/pix-keys/domain';
import { UserEntity } from '@zro/users/domain';
import { PixKeyHistoryModel, PixKeyModel } from '@zro/pix-keys/infrastructure';
import { PixKeyFactory } from './pix_key.factory';

/**
 * PixKeyHistory factory.
 */
factory.define<PixKeyHistoryModel>(
  PixKeyHistoryModel.name,
  PixKeyHistoryModel,
  () => {
    return {
      id: uuidV4(),
      pixKeyId: factory.assoc(PixKeyModel.name, 'id'),
      state: KeyState.PENDING,
      pixKey: factory.assoc(PixKeyModel.name),
    };
  },
);

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PixKeyHistoryEntity.name);

factory.define<PixKeyHistoryEntity>(
  PixKeyHistoryEntity.name,
  DefaultModel,
  async () => {
    return {
      id: uuidV4(),
      state: KeyState.PENDING,
      pixKey: await PixKeyFactory.create<PixKeyEntity>(PixKeyEntity.name),
      user: new UserEntity({ uuid: uuidV4() }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
  {
    afterBuild: (model) => {
      return new PixKeyHistoryEntity(model);
    },
  },
);

export const PixKeyHistoryFactory = factory;
