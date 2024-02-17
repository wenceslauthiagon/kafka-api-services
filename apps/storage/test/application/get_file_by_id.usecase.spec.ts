import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { FileEntity, FileRepository } from '@zro/storage/domain';
import {
  FileNotFoundException,
  GetFileByIdUseCase,
} from '@zro/storage/application';
import { FileFactory } from '@zro/test/storage/config';

describe('GetFileByIdUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { fileRepository, mockGetFileByIdRepository } = mockRepository();

    const sut = new GetFileByIdUseCase(logger, fileRepository);

    return {
      sut,
      mockGetFileByIdRepository,
    };
  };

  const mockRepository = () => {
    const fileRepository: FileRepository = createMock<FileRepository>();
    const mockGetFileByIdRepository: jest.Mock = On(fileRepository).get(
      method((mock) => mock.getById),
    );

    return {
      fileRepository,
      mockGetFileByIdRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not be able to get file with no data passed', async () => {
      const { sut, mockGetFileByIdRepository } = makeSut();

      mockGetFileByIdRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetFileByIdRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not be able to get file with wrong id passed', async () => {
      const { sut, mockGetFileByIdRepository } = makeSut();

      mockGetFileByIdRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(uuidV4());

      await expect(testScript).rejects.toThrow(FileNotFoundException);
      expect(mockGetFileByIdRepository).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should be able to get file by certain id successfully', async () => {
      const { sut, mockGetFileByIdRepository } = makeSut();

      const file = await FileFactory.create<FileEntity>(FileEntity.name);

      mockGetFileByIdRepository.mockResolvedValue(file);

      const result = await sut.execute(file.id);

      expect(result).toBeDefined();
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.fileName).toBeDefined();
      expect(result.folderName).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockGetFileByIdRepository).toHaveBeenCalledTimes(1);
    });
  });
});
