import { Test, TestingModule } from '@nestjs/testing';
import {
  MissingDataException,
  PaginationEntity,
  defaultLogger as logger,
} from '@zro/common';
import { FileRepository } from '@zro/storage/domain';
import {
  FileModel,
  GetAllFilesByFolderRestController as Controller,
  FileDatabaseRepository,
} from '@zro/storage/infrastructure';
import { AppModule } from '@zro/storage/infrastructure/nest/modules/app.module';
import { FileFactory } from '@zro/test/storage/config';
import { GetAllFilesByFolderRequestSort } from '@zro/storage/interface';

describe('GetAllFilesByFolderMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let fileRepository: FileRepository;
  const folderName = 'test';

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    fileRepository = new FileDatabaseRepository();
  });

  describe('GetAllFilesByFolder', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to get all files in certain folder successfully', async () => {
        await FileFactory.create<FileModel>(FileModel.name, {
          folderName,
        });

        const pagination = new PaginationEntity();

        const params = {
          folderName,
          ...pagination,
          page: pagination.page,
          pageSize: pagination.pageSize,
          sort: GetAllFilesByFolderRequestSort.CREATED_AT,
        };

        const result = await controller.execute(fileRepository, logger, params);

        expect(result).toBeDefined();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not be able get all files without foldername', async () => {
        await FileFactory.create<FileModel>(FileModel.name, {
          folderName,
        });

        const pagination = new PaginationEntity();

        const params = {
          folderName: null as string,
          ...pagination,
          page: pagination.page,
          pageSize: pagination.pageSize,
          sort: GetAllFilesByFolderRequestSort.CREATED_AT,
        };

        const testScript = () =>
          controller.execute(fileRepository, logger, params);

        await expect(testScript).rejects.toThrow(MissingDataException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
