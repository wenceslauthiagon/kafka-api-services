import * as fs from 'fs';
import * as path from 'path';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { FileEntity, FileRepository } from '@zro/storage/domain';
import {
  DeleteFileUseCase,
  FileNotFoundException,
  StorageGateway,
} from '@zro/storage/application';
import { FileFactory } from '@zro/test/storage/config';

describe('DeleteFileUseCase', () => {
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
    const {
      fileRepository,
      mockGetByIdFileRepository,
      mockRemoveFileRepository,
    } = mockRepository();

    const { storageGateway, mockDeleteFileStorageGateway } = mockGateway();

    const sut = new DeleteFileUseCase(logger, fileRepository, storageGateway);

    return {
      sut,
      mockGetByIdFileRepository,
      mockRemoveFileRepository,
      mockDeleteFileStorageGateway,
    };
  };

  const mockRepository = () => {
    const fileRepository: FileRepository = createMock<FileRepository>();
    const mockGetByIdFileRepository: jest.Mock = On(fileRepository).get(
      method((mock) => mock.getById),
    );
    const mockRemoveFileRepository: jest.Mock = On(fileRepository).get(
      method((mock) => mock.update),
    );

    return {
      fileRepository,
      mockGetByIdFileRepository,
      mockRemoveFileRepository,
    };
  };

  const mockGateway = () => {
    const storageGateway: StorageGateway = createMock<StorageGateway>();
    const mockDeleteFileStorageGateway: jest.Mock = On(storageGateway).get(
      method((mock) => mock.deleteFile),
    );

    return {
      storageGateway,
      mockDeleteFileStorageGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not be able to delete a file with wrong id passed', async () => {
      const {
        sut,
        mockGetByIdFileRepository,
        mockRemoveFileRepository,
        mockDeleteFileStorageGateway,
      } = makeSut();

      const file = await FileFactory.create<FileEntity>(FileEntity.name);

      mockGetByIdFileRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(file);

      await expect(testScript).rejects.toThrow(FileNotFoundException);
      expect(mockGetByIdFileRepository).toHaveBeenCalledTimes(1);
      expect(mockRemoveFileRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteFileStorageGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should be able to delete a file by id successfully', async () => {
      const {
        sut,
        mockGetByIdFileRepository,
        mockRemoveFileRepository,
        mockDeleteFileStorageGateway,
      } = makeSut();

      const file = await FileFactory.create<FileEntity>(FileEntity.name);

      mockGetByIdFileRepository.mockResolvedValue(file);

      const filePath = path.join(
        process.cwd(),
        filePathEnv,
        folderName,
        `${file.fileName}.xlsx`,
      );

      fs.writeFileSync(filePath, 'hello, that is just an example');

      const result = await sut.execute(file);

      fs.unlinkSync(filePath);

      expect(result).toBeUndefined();
      expect(mockGetByIdFileRepository).toHaveBeenCalledTimes(1);
      expect(mockRemoveFileRepository).toHaveBeenCalledTimes(1);
      expect(mockDeleteFileStorageGateway).toHaveBeenCalledTimes(1);
    });
  });
});
