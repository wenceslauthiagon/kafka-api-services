import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidV4 } from 'uuid';
import { Readable } from 'stream';
import { Test, TestingModule } from '@nestjs/testing';
import { createRandomCode, defaultLogger as logger } from '@zro/common';
import { FileRepository } from '@zro/storage/domain';
import {
  FileAlreadyExistsException,
  StorageGateway,
} from '@zro/storage/application';
import {
  UploadFileRestController as Controller,
  FileDatabaseRepository,
} from '@zro/storage/infrastructure';
import { AppModule } from '@zro/storage/infrastructure/nest/modules/app.module';
import { createMock } from 'ts-auto-mock';

describe('UploadFileMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let fileRepository: FileRepository;
  const filePathEnv = 'test';
  const folderName = 'test';

  const storageGateway: StorageGateway = createMock<StorageGateway>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<Controller>(Controller);
    fileRepository = new FileDatabaseRepository();

    if (!fs.existsSync(path.join(process.cwd(), filePathEnv, folderName))) {
      fs.mkdirSync(path.join(process.cwd(), filePathEnv, folderName), {
        recursive: true,
      });
    }
  });

  beforeEach(() => jest.resetAllMocks());

  describe('UploadFile', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to store file successfully', async () => {
        const filename = createRandomCode(6);

        const filePath = path.join(
          process.cwd(),
          filePathEnv,
          folderName,
          `${filename}.xlsx`,
        );

        fs.writeFileSync(filePath, 'that is a test file');

        const buffer = fs.readFileSync(filePath);

        const file: Express.Multer.File = {
          fieldname: 'test',
          originalname: `${filename}.xlsx`,
          buffer,
          mimetype: 'test',
          filename,
          path: filePath,
          size: 100,
          stream: new Readable(),
          destination: '',
          encoding: 'utf-8',
        };

        const result = await controller.execute(
          file,
          fileRepository,
          logger,
          storageGateway,
          {
            id: uuidV4(),
            folderName,
          },
        );

        expect(result).toBeDefined();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not be able to store file with same id passed', async () => {
        const filename = createRandomCode(6);
        const id = uuidV4();

        const filePath = path.join(
          process.cwd(),
          filePathEnv,
          folderName,
          `${filename}.xlsx`,
        );

        fs.writeFileSync(filePath, 'that is a test file');

        const buffer = fs.readFileSync(filePath);

        const file: Express.Multer.File = {
          fieldname: 'test',
          originalname: `${filename}.xlsx`,
          buffer,
          mimetype: 'test',
          filename,
          path: filePath,
          size: 100,
          stream: new Readable(),
          destination: '',
          encoding: 'utf-8',
        };

        await controller.execute(file, fileRepository, logger, storageGateway, {
          id,
          folderName,
        });

        const newFilename = createRandomCode(6);

        const newFilePath = path.join(
          process.cwd(),
          filePathEnv,
          folderName,
          `${filename}.xlsx`,
        );

        fs.writeFileSync(newFilePath, 'that is a test file');

        const newBuffer = fs.readFileSync(newFilePath);

        const newFile: Express.Multer.File = {
          fieldname: 'test',
          originalname: `${newFilename}.xlsx`,
          buffer: newBuffer,
          mimetype: 'test',
          filename: newFilename,
          path: newFilePath,
          size: 100,
          stream: new Readable(),
          destination: '',
          encoding: 'utf-8',
        };

        const testScript = () =>
          controller.execute(newFile, fileRepository, logger, storageGateway, {
            id,
            folderName,
          });

        await expect(testScript).rejects.toThrow(FileAlreadyExistsException);
      });
    });
  });

  afterAll(async () => {
    fs.rmSync(path.join(process.cwd(), filePathEnv, folderName), {
      recursive: true,
      force: true,
    });

    await module.close();
  });
});
