import * as fs from 'fs';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  FileNotStorageException,
  StorageFileGateway,
  FileStorageModule as AppModule,
} from '@zro/file-storage/infrastructure';

describe('StorageFileGateway', () => {
  let module: TestingModule;
  const oldPath = 'files-storage-tmp';
  const newPath = 'files-storage';
  const folderName = 'test';
  let storageFileGateway: StorageFileGateway;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    storageFileGateway = new StorageFileGateway(logger);

    if (!fs.existsSync(path.join(process.cwd(), oldPath, folderName))) {
      fs.mkdirSync(path.join(process.cwd(), oldPath, folderName), {
        recursive: true,
      });
    }

    if (!fs.existsSync(path.join(process.cwd(), newPath, folderName))) {
      fs.mkdirSync(path.join(process.cwd(), newPath, folderName), {
        recursive: true,
      });
    }
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not be able to store a file with missing params', async () => {
      const tests = [
        () => storageFileGateway.storageFile({ oldPath: null, newPath }),
        () => storageFileGateway.storageFile({ oldPath, newPath: null }),
        () => storageFileGateway.storageFile({ oldPath: null, newPath: null }),
      ];

      for (const i of tests) {
        await expect(i).rejects.toThrow(MissingDataException);
      }
    });

    it('TC0002 - Should not be able to store a file with wrong path', async () => {
      const testScript = () =>
        storageFileGateway.storageFile({ oldPath: 'random-path', newPath });

      await expect(testScript).rejects.toThrow(FileNotStorageException);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should be able to store a file successfully', async () => {
      const file: Express.Multer.File = {
        fieldname: 'test',
        originalname: 'test',
        buffer: Buffer.from('test'),
        mimetype: 'test',
        filename: 'testFile.xlsx',
        path: path.join(process.cwd(), oldPath, 'testFile.xlsx'),
        size: 100,
        stream: new Readable(),
        destination: '',
        encoding: 'utf-8',
      };

      fs.writeFileSync(file.path, file.buffer);

      const newPathJoin = path.join(process.cwd(), newPath, file.filename);

      const result = await storageFileGateway.storageFile({
        oldPath: file.path,
        newPath: newPathJoin,
      });

      fs.unlinkSync(newPathJoin);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
