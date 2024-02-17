import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { FileRepository } from '@zro/storage/domain';
import { FileNotFoundException } from '@zro/storage/application';
import {
  FileModel,
  GetFileByIdRestController as Controller,
  FileDatabaseRepository,
} from '@zro/storage/infrastructure';
import { AppModule } from '@zro/storage/infrastructure/nest/modules/app.module';
import { FileFactory } from '@zro/test/storage/config';

describe('GetFileByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let fileRepository: FileRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    fileRepository = new FileDatabaseRepository();
  });

  describe('GetFileById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to get file with certain id successfully', async () => {
        const { id } = await FileFactory.create<FileModel>(FileModel.name);

        const params = { id };

        const result = await controller.execute(fileRepository, logger, params);

        expect(result).toBeDefined();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not be able get file without data passed', async () => {
        const testScript = () =>
          controller.execute(fileRepository, logger, { id: null });

        await expect(testScript).rejects.toThrow(MissingDataException);
      });

      it('TC0003 - Should not be able get file without wrong id passed', async () => {
        const params = { id: uuidV4() };

        const testScript = () =>
          controller.execute(fileRepository, logger, params);

        await expect(testScript).rejects.toThrow(FileNotFoundException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
