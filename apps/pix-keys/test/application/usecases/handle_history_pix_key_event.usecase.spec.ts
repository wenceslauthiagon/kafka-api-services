import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixKeyRepository,
  PixKeyHistoryRepository,
  PixKeyEntity,
  PixKeyHistoryEntity,
} from '@zro/pix-keys/domain';
import {
  HandleHistoryPixKeyEventUseCase,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import { PixKeyFactory, PixKeyHistoryFactory } from '@zro/test/pix-keys/config';

describe('GetHistoryByIdPixKeyUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      pixKeyRepository,
      mockGetRepository,
      pixKeyHistoryRepository,
      mockCreateHistoryRepository,
    } = mockRepository();
    const sut = new HandleHistoryPixKeyEventUseCase(
      logger,
      pixKeyRepository,
      pixKeyHistoryRepository,
    );
    return {
      sut,
      mockGetRepository,
      mockCreateHistoryRepository,
    };
  };

  const mockRepository = () => {
    const pixKeyHistoryRepository: PixKeyHistoryRepository =
      createMock<PixKeyHistoryRepository>();
    const mockCreateHistoryRepository: jest.Mock = On(
      pixKeyHistoryRepository,
    ).get(method((mock) => mock.create));

    const pixKeyRepository: PixKeyRepository = createMock<PixKeyRepository>();
    const mockGetRepository: jest.Mock = On(pixKeyRepository).get(
      method((mock) => mock.getById),
    );

    return {
      pixKeyRepository,
      mockGetRepository,
      pixKeyHistoryRepository,
      mockCreateHistoryRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create history pix key without id and state', async () => {
      const { sut, mockGetRepository, mockCreateHistoryRepository } = makeSut();

      const testScript = () => sut.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateHistoryRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create history when pix key not found', async () => {
      const { sut, mockGetRepository, mockCreateHistoryRepository } = makeSut();
      const { id, state } = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );
      mockGetRepository.mockReturnValue(undefined);

      const testScript = () => sut.execute(id, state);

      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateHistoryRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should create history with successfully', async () => {
      const { sut, mockGetRepository, mockCreateHistoryRepository } = makeSut();

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
      );
      const pixKeyHistory =
        await PixKeyHistoryFactory.create<PixKeyHistoryEntity>(
          PixKeyHistoryEntity.name,
        );

      mockGetRepository.mockResolvedValue(pixKey);
      mockCreateHistoryRepository.mockResolvedValue(pixKeyHistory);

      const result = await sut.execute(pixKey.id, pixKey.state);

      expect(result).toBeDefined();
      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateHistoryRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRepository).toHaveBeenCalledWith(pixKey.id);
    });
  });
});
