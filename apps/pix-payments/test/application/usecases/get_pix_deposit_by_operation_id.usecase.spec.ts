import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  PixDepositRepository,
  PixDepositEntity,
} from '@zro/pix-payments/domain';
import { OperationEntity } from '@zro/operations/domain';
import { GetPixDepositByOperationIdUseCase as UseCase } from '@zro/pix-payments/application';
import { PixDepositFactory } from '@zro/test/pix-payments/config';

describe('GetPixDepositByOperationIdUseCase', () => {
  const depositRepositoryMock: PixDepositRepository =
    createMock<PixDepositRepository>();
  const mockGetByOperation: jest.Mock = On(depositRepositoryMock).get(
    method((mock) => mock.getByOperation),
  );

  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should get a deposit by operationId and user successfully', async () => {
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      mockGetByOperation.mockResolvedValue(deposit);

      const usecase = new UseCase(logger, depositRepositoryMock);

      const result = await usecase.execute(deposit.operation, deposit.user);

      expect(result).toBeDefined();
      expect(result).toMatchObject(deposit);

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should get a deposit by operationId successfully', async () => {
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      mockGetByOperation.mockResolvedValue(deposit);

      const usecase = new UseCase(logger, depositRepositoryMock);

      const result = await usecase.execute(deposit.operation, null);

      expect(result).toBeDefined();
      expect(result).toMatchObject(deposit);

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should get a deposit by operationId and wallet successfully', async () => {
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      mockGetByOperation.mockResolvedValue(deposit);

      const usecase = new UseCase(logger, depositRepositoryMock);

      const result = await usecase.execute(
        deposit.operation,
        null,
        deposit.wallet,
      );

      expect(result).toBeDefined();
      expect(result).toMatchObject(deposit);

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it("TC0004 - Should not get deposit if it isn't found", async () => {
      const operation = new OperationEntity({ id: faker.datatype.uuid() });
      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      mockGetByOperation.mockResolvedValue(null);

      const usecase = new UseCase(logger, depositRepositoryMock);

      const result = await usecase.execute(operation, user);

      expect(result).toBeNull();

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
    });
  });
});
