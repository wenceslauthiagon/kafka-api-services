// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { FileEntity } from '@zro/storage/domain';
import { FileModel } from '@zro/storage/infrastructure';

const fakerModel = () => ({
  fileName: `${faker.random.word()}.txt`,
  folderName: faker.random.word(),
  createdAt: faker.date.recent(99),
  updatedAt: faker.date.recent(99),
});

/**
 * File factory.
 */
factory.define<FileModel>(FileModel.name, FileModel, () => fakerModel());

/**
 * File entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, FileEntity.name);

factory.define<FileEntity>(
  FileEntity.name,
  DefaultModel,
  () => ({ id: faker.datatype.uuid(), ...fakerModel() }),
  {
    afterBuild: (model) => {
      return new FileEntity(model);
    },
  },
);

export const FileFactory = factory;
