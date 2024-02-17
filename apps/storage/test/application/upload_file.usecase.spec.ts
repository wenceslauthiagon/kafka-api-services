import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { FileEntity, FileRepository } from '@zro/storage/domain';
import {
  FileAlreadyExistsException,
  StorageGateway,
  UploadFileUseCase,
} from '@zro/storage/application';
import { FileFactory } from '@zro/test/storage/config';

describe('UploadFileUseCase', () => {
  const filePathEnv = 'files-storage';
  const folderName = 'test';

  beforeAll(async () => {
    if (!fs.existsSync(path.join(filePathEnv, folderName))) {
      fs.mkdirSync(path.join(filePathEnv, folderName), { recursive: true });
    }
  });

  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      fileRepository,
      mockGetByIdFileRepository,
      mockCreateFileRepository,
    } = mockRepository();

    const { storageGateway, mockStoreFileStorageGateway } = mockGateway();

    const sut = new UploadFileUseCase(logger, fileRepository, storageGateway);

    return {
      sut,
      mockGetByIdFileRepository,
      mockCreateFileRepository,
      mockStoreFileStorageGateway,
    };
  };

  const mockRepository = () => {
    const fileRepository: FileRepository = createMock<FileRepository>();
    const mockGetByIdFileRepository: jest.Mock = On(fileRepository).get(
      method((mock) => mock.getById),
    );
    const mockCreateFileRepository: jest.Mock = On(fileRepository).get(
      method((mock) => mock.create),
    );

    return {
      fileRepository,
      mockGetByIdFileRepository,
      mockCreateFileRepository,
    };
  };

  const mockGateway = () => {
    const storageGateway: StorageGateway = createMock<StorageGateway>();
    const mockStoreFileStorageGateway: jest.Mock = On(storageGateway).get(
      method((mock) => mock.storageFile),
    );

    return {
      storageGateway,
      mockStoreFileStorageGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not be able to store a file with no data passed', async () => {
      const {
        sut,
        mockGetByIdFileRepository,
        mockCreateFileRepository,
        mockStoreFileStorageGateway,
      } = makeSut();

      const file: Express.Multer.File = {
        fieldname: 'test',
        originalname: 'test',
        buffer: Buffer.from('test'),
        mimetype: 'test',
        filename: 'testFile',
        path: path.join(filePathEnv, folderName, 'testFile.xlsx'),
        size: 100,
        stream: new Readable(),
        destination: '',
        encoding: 'utf-8',
      };

      const testScript = () => sut.execute(null, null, file);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdFileRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateFileRepository).toHaveBeenCalledTimes(0);
      expect(mockStoreFileStorageGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not be able to store a file already in it', async () => {
      const {
        sut,
        mockGetByIdFileRepository,
        mockCreateFileRepository,
        mockStoreFileStorageGateway,
      } = makeSut();

      const file: Express.Multer.File = {
        fieldname: 'test',
        originalname: 'test',
        buffer: Buffer.from('test'),
        mimetype: 'test',
        filename: 'testFile',
        path: path.join(filePathEnv, folderName, 'testFile.xlsx'),
        size: 100,
        stream: new Readable(),
        destination: '',
        encoding: 'utf-8',
      };

      const fileEntity = await FileFactory.create<FileEntity>(FileEntity.name);

      mockGetByIdFileRepository.mockResolvedValue(fileEntity);

      const testScript = () => sut.execute(fileEntity.id, folderName, file);

      await expect(testScript).rejects.toThrow(FileAlreadyExistsException);
      expect(mockGetByIdFileRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateFileRepository).toHaveBeenCalledTimes(0);
      expect(mockStoreFileStorageGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should be able to store a file successfully', async () => {
      const {
        sut,
        mockGetByIdFileRepository,
        mockCreateFileRepository,
        mockStoreFileStorageGateway,
      } = makeSut();

      const file: Express.Multer.File = {
        fieldname: 'test',
        originalname: 'test',
        buffer: Buffer.from('test'),
        mimetype: 'test',
        filename: 'testFile',
        path: path.join(filePathEnv, folderName, 'testFile.xlsx'),
        size: 100,
        stream: new Readable(),
        destination: '',
        encoding: 'utf-8',
      };

      fs.writeFileSync(file.path, file.buffer);

      const id = uuidV4();

      mockGetByIdFileRepository.mockResolvedValue(undefined);
      mockStoreFileStorageGateway.mockResolvedValue({ success: true });

      const result = await sut.execute(id, folderName, file);

      fs.unlinkSync(file.path);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.folderName).toBe(folderName);
      expect(mockGetByIdFileRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateFileRepository).toHaveBeenCalledTimes(1);
      expect(mockStoreFileStorageGateway).toHaveBeenCalledTimes(1);
    });
  });
});
