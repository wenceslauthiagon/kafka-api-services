import { v4 as uuidV4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { FileRepository } from '@zro/storage/domain';
import {
  FileModel,
  DeleteFileRestController as Controller,
  FileDatabaseRepository,
} from '@zro/storage/infrastructure';
import { AppModule } from '@zro/storage/infrastructure/nest/modules/app.module';
import { FileFactory } from '@zro/test/storage/config';
import {
  StorageGateway,
  FileNotFoundException,
} from '@zro/storage/application';
import { createMock } from 'ts-auto-mock';

describe('DeleteFileMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let fileRepository: FileRepository;
  const filePathEnv = 'test';
  const folder = 'test';

  const storageGateway: StorageGateway = createMock<StorageGateway>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<Controller>(Controller);

    fileRepository = new FileDatabaseRepository();
    if (!fs.existsSync(path.join(process.cwd(), filePathEnv, folder))) {
      fs.mkdirSync(path.join(process.cwd(), filePathEnv, folder), {
        recursive: true,
      });
    }
  });

  describe('DeleteFile', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to delete file successfully', async () => {
        const { id, fileName, folderName } =
          await FileFactory.create<FileModel>(FileModel.name, {
            folderName: folder,
          });

        const filePath = path.join(
          process.cwd(),
          filePathEnv,
          folderName,
          fileName,
        );

        fs.writeFileSync(filePath, 'that is a test file');

        const result = await controller.execute(
          fileRepository,
          logger,
          storageGateway,
          { id },
        );

        expect(result).toBeUndefined();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not be able to delete file because file was not found', async () => {
        const id = uuidV4();

        const testScript = () =>
          controller.execute(fileRepository, logger, storageGateway, { id });

        await expect(testScript).rejects.toThrow(FileNotFoundException);
      });

      it('TC0003 - Should not be able to delete file with no data passed', async () => {
        await FileFactory.create<FileModel>(FileModel.name, {
          folderName: folder,
        });

        const testScript = () =>
          controller.execute(fileRepository, logger, storageGateway, {
            id: null,
          });

        await expect(testScript).rejects.toThrow(MissingDataException);
      });
    });
  });

  afterAll(async () => {
    fs.rmSync(path.join(process.cwd(), filePathEnv, folder), {
      recursive: true,
      force: true,
    });
    await module.close();
  });
});
