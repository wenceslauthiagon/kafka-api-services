import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  PixDepositRepository,
  PixDepositEntity,
} from '@zro/pix-payments/domain';
import { GetPixDepositByIdUseCase as UseCase } from '@zro/pix-payments/application';
import { PixDepositFactory } from '@zro/test/pix-payments/config';

describe('GetPixDepositByIdUseCase', () => {
  const depositRepositoryMock: PixDepositRepository =
    createMock<PixDepositRepository>();
  const mockGetById: jest.Mock = On(depositRepositoryMock).get(
    method((mock) => mock.getById),
  );

  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should get a deposit by id', async () => {
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      mockGetById.mockResolvedValue(deposit);

      const usecase = new UseCase(logger, depositRepositoryMock);

      const result = await usecase.execute(deposit.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(deposit);
      expect(mockGetById).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should get a deposit by id and user', async () => {
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      mockGetById.mockResolvedValue(deposit);

      const usecase = new UseCase(logger, depositRepositoryMock);

      const result = await usecase.execute(deposit.id, deposit.user);

      expect(result).toBeDefined();
      expect(result).toMatchObject(deposit);
      expect(mockGetById).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should get a deposit by id and wallet', async () => {
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      mockGetById.mockResolvedValue(deposit);

      const usecase = new UseCase(logger, depositRepositoryMock);

      const result = await usecase.execute(deposit.id, null, deposit.wallet);

      expect(result).toBeDefined();
      expect(result).toMatchObject(deposit);
      expect(mockGetById).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should throw MissingDataException if missing params', async () => {
      const usecase = new UseCase(logger, depositRepositoryMock);

      const testScript = () => usecase.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetById).toHaveBeenCalledTimes(0);
    });

    it("TC0004 - Should not get deposit if it isn't found", async () => {
      const invalidId = faker.datatype.uuid();

      mockGetById.mockResolvedValue(null);

      const usecase = new UseCase(logger, depositRepositoryMock);

      const result = await usecase.execute(invalidId);

      expect(result).toBeNull();
      expect(mockGetById).toHaveBeenCalledTimes(1);
    });
  });
});
