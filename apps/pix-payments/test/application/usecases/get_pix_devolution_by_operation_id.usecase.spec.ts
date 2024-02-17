import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  PixDepositEntity,
  PixDepositRepository,
  PixDevolutionEntity,
  PixDevolutionRepository,
} from '@zro/pix-payments/domain';
import { OperationEntity } from '@zro/operations/domain';
import {
  GetPixDevolutionByOperationIdUseCase as UseCase,
  PixDepositNotFoundException,
} from '@zro/pix-payments/application';
import {
  PixDepositFactory,
  PixDevolutionFactory,
} from '@zro/test/pix-payments/config';

describe('GetPixDevolutionByOperationIdUseCase', () => {
  const devolutionRepositoryMock: PixDevolutionRepository =
    createMock<PixDevolutionRepository>();
  const mockGetByOperation: jest.Mock = On(devolutionRepositoryMock).get(
    method((mock) => mock.getByOperation),
  );

  const depositRepositoryMock: PixDepositRepository =
    createMock<PixDepositRepository>();
  const mockDepositGetById: jest.Mock = On(depositRepositoryMock).get(
    method((mock) => mock.getById),
  );

  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should get a PixDevolution by operationId and user successfully', async () => {
      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
      );
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      mockGetByOperation.mockResolvedValue(devolution);
      mockDepositGetById.mockResolvedValue(deposit);

      const usecase = new UseCase(
        logger,
        devolutionRepositoryMock,
        depositRepositoryMock,
      );

      const result = await usecase.execute(
        devolution.operation,
        devolution.user,
      );

      expect(result).toBeDefined();
      expect(result).toMatchObject({ ...devolution, deposit });
      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
      expect(mockDepositGetById).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should get a PixDevolution by operationId successfully', async () => {
      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
      );
      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      mockGetByOperation.mockResolvedValue(devolution);
      mockDepositGetById.mockResolvedValue(deposit);

      const usecase = new UseCase(
        logger,
        devolutionRepositoryMock,
        depositRepositoryMock,
      );

      const result = await usecase.execute(devolution.operation, null);

      expect(result).toBeDefined();
      expect(result).toMatchObject({ ...devolution, deposit });

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
      expect(mockDepositGetById).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it("TC0003 - Should not get PixDevolution if it isn't found", async () => {
      const operation = new OperationEntity({ id: faker.datatype.uuid() });
      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      mockGetByOperation.mockResolvedValue(null);

      const usecase = new UseCase(
        logger,
        devolutionRepositoryMock,
        depositRepositoryMock,
      );

      const result = await usecase.execute(operation, user);

      expect(result).toBeNull();

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
      expect(mockDepositGetById).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not get PixDevolution without deposit', async () => {
      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
      );

      mockGetByOperation.mockResolvedValue(devolution);
      mockDepositGetById.mockResolvedValue(null);

      const usecase = new UseCase(
        logger,
        devolutionRepositoryMock,
        depositRepositoryMock,
      );

      const testScript = () =>
        usecase.execute(devolution.operation, devolution.user);

      await expect(testScript).rejects.toThrow(PixDepositNotFoundException);

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
      expect(mockDepositGetById).toHaveBeenCalledTimes(1);
    });
  });
});
