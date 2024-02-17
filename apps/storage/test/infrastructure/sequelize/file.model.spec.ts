import { Test, TestingModule } from '@nestjs/testing';
import { FileModel } from '@zro/storage/infrastructure';
import { AppModule } from '@zro/storage/infrastructure/nest/modules/app.module';
import { FileFactory } from '@zro/test/storage/config';

describe('FileModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - Module should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - File model should be created', async () => {
    const file = await FileFactory.create<FileModel>(FileModel.name);

    expect(file).toBeDefined();
    expect(file.id).toBeDefined();
    expect(file.fileName).toBeDefined();
    expect(file.folderName).toBeDefined();
    expect(file.createdAt).toBeDefined();
    expect(file.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
