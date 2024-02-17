import * as fs from 'fs';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  DeleteFileStorageGateway,
  FileNotFoundException,
  FileStorageModule as AppModule,
} from '@zro/file-storage';

describe('DeleteFileStorageGateway', () => {
  let module: TestingModule;
  const newPath = 'files-storage';
  const folderName = 'test';
  let deleteFileGateway: DeleteFileStorageGateway;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    deleteFileGateway = new DeleteFileStorageGateway(logger);
    if (!fs.existsSync(path.join(process.cwd(), newPath, folderName))) {
      fs.mkdirSync(path.join(process.cwd(), newPath, folderName), {
        recursive: true,
      });
    }
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not be able to delete a file with missing param', async () => {
      await expect(deleteFileGateway.deleteFile(null)).rejects.toThrow(
        MissingDataException,
      );
    });

    it('TC0002 - Should not be able to delete a file with wrong param', async () => {
      const testScript = () =>
        deleteFileGateway.deleteFile({ filePath: 'wrong-path' });

      await expect(testScript).rejects.toThrow(FileNotFoundException);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should be able to delete a file successfully', async () => {
      const file: Express.Multer.File = {
        fieldname: 'test',
        originalname: 'test',
        buffer: Buffer.from('test'),
        mimetype: 'test',
        filename: 'testFile.xlsx',
        path: path.join(process.cwd(), newPath, folderName, 'testFile.xlsx'),
        size: 100,
        stream: new Readable(),
        destination: '',
        encoding: 'utf-8',
      };

      fs.writeFileSync(file.path, file.buffer);

      const result = await deleteFileGateway.deleteFile({
        filePath: file.path,
      });

      expect(result).toBeUndefined();
    });
  });

  afterAll(async () => {
    fs.rmSync(path.join(process.cwd(), newPath, folderName), {
      recursive: true,
      force: true,
    });
    await module.close();
  });
});
