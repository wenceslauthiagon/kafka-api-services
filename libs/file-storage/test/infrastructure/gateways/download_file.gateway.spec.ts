import * as fs from 'fs';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  FileNotFoundException,
  DownloadFileStorageGateway,
  FileStorageModule as AppModule,
} from '@zro/file-storage/infrastructure';

describe('DownloadFileStorageGateway', () => {
  let module: TestingModule;
  let downloadFileGateway: DownloadFileStorageGateway;
  const newPath = 'files-storage';
  const folderName = 'test';

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    downloadFileGateway = new DownloadFileStorageGateway(logger);
    if (!fs.existsSync(path.join(process.cwd(), newPath, folderName))) {
      fs.mkdirSync(path.join(process.cwd(), newPath, folderName), {
        recursive: true,
      });
    }
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not be able to get a file with missing param', async () => {
      await expect(downloadFileGateway.downloadFile(null)).rejects.toThrow(
        MissingDataException,
      );
    });

    it('TC0002 - Should not be able to get a file with wrong param', async () => {
      await expect(
        downloadFileGateway.downloadFile({ filePath: 'wrong-path' }),
      ).rejects.toThrow(FileNotFoundException);
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
        path: path.join(process.cwd(), newPath, folderName, 'testFile.xlsx'),
        size: 100,
        stream: new Readable(),
        destination: '',
        encoding: 'utf-8',
      };

      fs.writeFileSync(file.path, file.buffer);

      const result = await downloadFileGateway.downloadFile({
        filePath: file.path,
      });

      fs.unlinkSync(file.path);

      expect(result).toBeDefined();
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
