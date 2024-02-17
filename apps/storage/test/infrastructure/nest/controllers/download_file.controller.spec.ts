import { v4 as uuidV4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { FileRepository } from '@zro/storage/domain';
import {
  FileModel,
  DownloadFileRestController as Controller,
  FileDatabaseRepository,
} from '@zro/storage/infrastructure';
import { AppModule } from '@zro/storage/infrastructure/nest/modules/app.module';
import { FileFactory } from '@zro/test/storage/config';
import {
  StorageGateway,
  FileNotFoundException,
} from '@zro/storage/application';
import { createMock } from 'ts-auto-mock';

describe('DownloadFileMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let fileRepository: FileRepository;
  const filePathEnv = 'test';
  const folderName = 'test';

  const storageGateway: StorageGateway = createMock<StorageGateway>();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    controller = module.get<Controller>(Controller);

    fileRepository = new FileDatabaseRepository();
    if (!fs.existsSync(path.join(process.cwd(), filePathEnv, folderName))) {
      fs.mkdirSync(path.join(process.cwd(), filePathEnv, folderName), {
        recursive: true,
      });
    }
  });

  describe('DownloadFile', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to store file successfully', async () => {
        const { id, fileName } = await FileFactory.create<FileModel>(
          FileModel.name,
          { folderName },
        );

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

        fs.unlinkSync(filePath);

        expect(result).toBeDefined();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not be able to download file because file was not found', async () => {
        const id = uuidV4();

        const testScript = () =>
          controller.execute(fileRepository, logger, storageGateway, { id });

        await expect(testScript).rejects.toThrow(FileNotFoundException);
      });

      it('TC0003 - Should not be able to download file with no data passed', async () => {
        const testScript = () =>
          controller.execute(fileRepository, logger, storageGateway, {
            id: null,
          });

        await expect(testScript).rejects.toThrow(MissingDataException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
