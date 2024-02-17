import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  WarningPixDevolutionEntity,
  WarningPixDevolutionRepository,
} from '@zro/pix-payments/domain';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity } from '@zro/operations/domain';
import { GetWarningPixDevolutionByOperationIdUseCase as UseCase } from '@zro/pix-payments/application';
import { WarningPixDevolutionFactory } from '@zro/test/pix-payments/config';

describe('GetWarningPixDevolutionByOperationIdUseCase', () => {
  const warningPixDevolutionRepositoryMock: WarningPixDevolutionRepository =
    createMock<WarningPixDevolutionRepository>();
  const mockGetByOperation: jest.Mock = On(
    warningPixDevolutionRepositoryMock,
  ).get(method((mock) => mock.getByOperation));

  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should get a WarningPixDevolution by operation and user successfully', async () => {
      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
        );

      mockGetByOperation.mockResolvedValue(warningPixDevolution);

      const usecase = new UseCase(logger, warningPixDevolutionRepositoryMock);

      const result = await usecase.execute(
        warningPixDevolution.operation,
        warningPixDevolution.user,
      );

      expect(result).toBeDefined();
      expect(result).toMatchObject(warningPixDevolution);

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw MissingDataException if missing params', async () => {
      const usecase = new UseCase(logger, warningPixDevolutionRepositoryMock);

      const testScript = () => usecase.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByOperation).toHaveBeenCalledTimes(0);
    });

    it("TC0003 - Should not get WarningPixDevolution if it isn't found", async () => {
      const operation = new OperationEntity({ id: faker.datatype.uuid() });
      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      mockGetByOperation.mockResolvedValue(null);

      const usecase = new UseCase(logger, warningPixDevolutionRepositoryMock);

      const result = await usecase.execute(operation, user);

      expect(result).toBeNull();

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should not get WarningPixDevolution if user not match', async () => {
      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
        );

      mockGetByOperation.mockResolvedValue(warningPixDevolution);

      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const usecase = new UseCase(logger, warningPixDevolutionRepositoryMock);

      const result = await usecase.execute(
        warningPixDevolution.operation,
        user,
      );

      expect(result).toBeNull();

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
    });
  });
});
