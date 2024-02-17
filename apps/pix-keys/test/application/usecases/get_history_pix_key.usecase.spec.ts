import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  Pagination,
  defaultLogger as logger,
} from '@zro/common';
import {
  GetPixKeyFilter,
  GetPixKeyHistoryFilter,
  PixKeyHistoryEntity,
  PixKeyHistoryRepository,
} from '@zro/pix-keys/domain';
import { GetHistoryPixKeyUseCase } from '@zro/pix-keys/application';
import { PixKeyHistoryFactory } from '@zro/test/pix-keys/config';

describe('GetHistoryByIdPixKeyUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { pixKeyHistoryRepository, mockGetRepository } = mockRepository();
    const sut = new GetHistoryPixKeyUseCase(logger, pixKeyHistoryRepository);
    return {
      sut,
      pixKeyHistoryRepository,
      mockGetRepository,
    };
  };

  const mockRepository = () => {
    const pixKeyHistoryRepository: PixKeyHistoryRepository =
      createMock<PixKeyHistoryRepository>();
    const mockGetRepository: jest.Mock = On(pixKeyHistoryRepository).get(
      method((mock) => mock.getByFilter),
    );
    return { pixKeyHistoryRepository, mockGetRepository };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get all history pix key successfully', async () => {
      const { sut, mockGetRepository, pixKeyHistoryRepository } = makeSut();
      const { id, pixKey, state } =
        await PixKeyHistoryFactory.create<PixKeyHistoryEntity>(
          PixKeyHistoryEntity.name,
        );
      mockGetRepository.mockReturnValue([{ id, pixKey, state }]);

      const pagination: Pagination = { page: 1, pageSize: 20 };
      const filter: GetPixKeyHistoryFilter = {};
      const filterPixKey: GetPixKeyFilter = {};
      const result = await sut.execute(pagination, filter, filterPixKey);

      expect(result).toBeDefined();
      expect(pixKeyHistoryRepository.getByFilter).toHaveBeenCalledWith(
        pagination,
        filter,
        filterPixKey,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get pix key', async () => {
      const { sut, mockGetRepository } = makeSut();
      mockGetRepository.mockReturnValue({
        data: [],
        page: 1,
        pageSize: 20,
        pageTotal: 0,
        total: 0,
      });

      const pagination: Pagination = { page: 1, pageSize: 20 };
      const filter: GetPixKeyHistoryFilter = {};
      const filterPixKey: GetPixKeyFilter = {};
      const result = await sut.execute(pagination, filter, filterPixKey);

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(mockGetRepository).toHaveBeenCalledWith(
        pagination,
        filter,
        filterPixKey,
      );
    });

    it('TC0003 - Should not get pix key without pagination', async () => {
      const { sut, mockGetRepository } = makeSut();
      const testScript = () => sut.execute(null, null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
    });
  });
});
