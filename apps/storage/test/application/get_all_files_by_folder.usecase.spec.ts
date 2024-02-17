import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  defaultLogger as logger,
  MissingDataException,
  PaginationEntity,
  paginationToDomain,
} from '@zro/common';
import { FileEntity, FileRepository } from '@zro/storage/domain';
import { GetAllFilesByFolderUseCase } from '@zro/storage/application';
import { FileFactory } from '@zro/test/storage/config';

describe('GetAllFilesByFolderUseCase', () => {
  const folderName = 'test';

  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { fileRepository, mockGetAllFilesByFolderRepository } =
      mockRepository();

    const sut = new GetAllFilesByFolderUseCase(logger, fileRepository);

    return {
      sut,
      mockGetAllFilesByFolderRepository,
    };
  };

  const mockRepository = () => {
    const fileRepository: FileRepository = createMock<FileRepository>();
    const mockGetAllFilesByFolderRepository: jest.Mock = On(fileRepository).get(
      method((mock) => mock.getAllByFoldername),
    );

    return {
      fileRepository,
      mockGetAllFilesByFolderRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not be able to get files without foldername', async () => {
      const { sut, mockGetAllFilesByFolderRepository } = makeSut();

      const pagination = new PaginationEntity();

      mockGetAllFilesByFolderRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(null, pagination);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetAllFilesByFolderRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should be able to get files in certain folder successfully', async () => {
      const { sut, mockGetAllFilesByFolderRepository } = makeSut();

      const pagination = new PaginationEntity();
      const file = await FileFactory.create<FileEntity>(FileEntity.name, {
        folderName,
      });
      const file2 = await FileFactory.create<FileEntity>(FileEntity.name, {
        folderName,
      });

      const paginationWithData = paginationToDomain(pagination, 2, [
        file,
        file2,
      ]);

      mockGetAllFilesByFolderRepository.mockResolvedValue(paginationWithData);

      const result = await sut.execute(folderName, pagination);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.fileName).toBeDefined();
        expect(res.folderName).toBeDefined();
        expect(res.createdAt).toBeDefined();
      });
      expect(mockGetAllFilesByFolderRepository).toHaveBeenCalledTimes(1);
    });
  });
});
