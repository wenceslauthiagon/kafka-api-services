import * as fs from 'fs';
import * as path from 'path';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { FileEntity, FileRepository } from '@zro/storage/domain';
import {
  DownloadFileUseCase,
  FileNotFoundException,
  StorageGateway,
} from '@zro/storage/application';
import { FileFactory } from '@zro/test/storage/config';

describe('DownloadFileUseCase', () => {
  const filePathEnv = 'files-storage';
  const folderName = 'test';

  beforeAll(async () => {
    if (!fs.existsSync(path.join(process.cwd(), filePathEnv, folderName))) {
      fs.mkdirSync(path.join(process.cwd(), filePathEnv, folderName), {
        recursive: true,
      });
    }
  });

  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { fileRepository, mockGetByIdFileRepository } = mockRepository();

    const { storageGateway, mockGetFileStorageGateway } = mockGateway();

    const sut = new DownloadFileUseCase(logger, fileRepository, storageGateway);

    return {
      sut,
      mockGetByIdFileRepository,
      mockGetFileStorageGateway,
    };
  };

  const mockRepository = () => {
    const fileRepository: FileRepository = createMock<FileRepository>();
    const mockGetByIdFileRepository: jest.Mock = On(fileRepository).get(
      method((mock) => mock.getById),
    );

    return {
      fileRepository,
      mockGetByIdFileRepository,
    };
  };

  const mockGateway = () => {
    const storageGateway: StorageGateway = createMock<StorageGateway>();
    const mockGetFileStorageGateway: jest.Mock = On(storageGateway).get(
      method((mock) => mock.downloadFile),
    );

    return {
      storageGateway,
      mockGetFileStorageGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not be able to get a file with wrong id passed', async () => {
      const { sut, mockGetByIdFileRepository, mockGetFileStorageGateway } =
        makeSut();

      const file = await FileFactory.create<FileEntity>(FileEntity.name);

      mockGetByIdFileRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(file.id);

      await expect(testScript).rejects.toThrow(FileNotFoundException);
      expect(mockGetByIdFileRepository).toHaveBeenCalledTimes(1);
      expect(mockGetFileStorageGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should be able to get a file by id successfully', async () => {
      const { sut, mockGetByIdFileRepository, mockGetFileStorageGateway } =
        makeSut();

      const file = await FileFactory.create<FileEntity>(FileEntity.name, {
        folderName,
      });

      mockGetByIdFileRepository.mockResolvedValue(file);

      const filePath = path.join(
        process.cwd(),
        filePathEnv,
        folderName,
        `${file.fileName}.xlsx`,
      );

      fs.writeFileSync(filePath, 'hello, that is just an example');

      const result = await sut.execute(file.id);

      fs.unlinkSync(filePath);

      expect(result).toBeDefined();
      expect(mockGetByIdFileRepository).toHaveBeenCalledTimes(1);
      expect(mockGetFileStorageGateway).toHaveBeenCalledTimes(1);
    });
  });
});
