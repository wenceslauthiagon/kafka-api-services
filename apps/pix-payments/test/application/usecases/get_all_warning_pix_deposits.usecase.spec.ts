import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MissingDataException,
  PaginationEntity,
  getMoment,
  defaultLogger as logger,
} from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { WarningPixDepositRepository } from '@zro/pix-payments/domain';
import { GetAllWarningPixDepositUseCase as UseCase } from '@zro/pix-payments/application';
import {
  WarningPixDepositDatabaseRepository,
  WarningPixDepositModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { WarningPixDepositFactory } from '@zro/test/pix-payments/config';

describe('GetAllWarningPixDepositUseCase', () => {
  let module: TestingModule;
  let warningDepositRepository: WarningPixDepositRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    warningDepositRepository = new WarningPixDepositDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get all warning deposits successfully - userId filter', async () => {
      const userId = uuidV4();

      await WarningPixDepositFactory.create<WarningPixDepositModel>(
        WarningPixDepositModel.name,
        { userId },
      );

      const usecase = new UseCase(logger, warningDepositRepository);

      const pagination = new PaginationEntity();
      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(pagination, user);

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
        expect(res.user.uuid).toBe(userId);
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0002 - Should get all warning deposits successfully - operationId filter', async () => {
      const operationId = uuidV4();

      await WarningPixDepositFactory.create<WarningPixDepositModel>(
        WarningPixDepositModel.name,
        { operationId },
      );

      const usecase = new UseCase(logger, warningDepositRepository);

      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination, null, null, operationId);

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
        expect(res.operation.id).toBe(operationId);
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0003 - Should get all warning deposits successfully - transactionTag filter', async () => {
      const transactionTag = 'PIXREC';

      await WarningPixDepositFactory.create<WarningPixDepositModel>(
        WarningPixDepositModel.name,
        { transactionTag },
      );

      const usecase = new UseCase(logger, warningDepositRepository);

      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination, null, transactionTag);

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
        expect(res.transactionTag).toBe(transactionTag);
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0004 - Should get all warning deposits successfully - created at filter', async () => {
      await WarningPixDepositFactory.create<WarningPixDepositModel>(
        WarningPixDepositModel.name,
        { createdAt: new Date('2022-09-01') },
      );

      const usecase = new UseCase(logger, warningDepositRepository);

      const pagination = new PaginationEntity();

      const result = await usecase.execute(
        pagination,
        null,
        null,
        null,
        new Date('2022-08-01'),
        new Date('2022-09-20'),
      );

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
        expect(res.createdAt).toBeDefined();
        expect(res.createdAt).toEqual(new Date('2022-09-01'));
      });
    });

    it('TC0005 - Should get all warning pix deposits successfully - updated at filter', async () => {
      await WarningPixDepositFactory.create<WarningPixDepositModel>(
        WarningPixDepositModel.name,
      );

      const usecase = new UseCase(logger, warningDepositRepository);

      const pagination = new PaginationEntity();

      const yesterday = getMoment().subtract(1, 'days');
      const tomorrow = getMoment().add(1, 'days');

      const result = await usecase.execute(
        pagination,
        null,
        null,
        null,
        null,
        yesterday.toDate(),
        tomorrow.toDate(),
      );

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
        expect(res.updatedAt).toBeDefined();
      });
    });
  });

  describe('With invalid parameters', () => {
    it('TC0006 - Should not get all warning deposits', async () => {
      const userId = uuidV4();

      await WarningPixDepositFactory.create<WarningPixDepositModel>(
        WarningPixDepositModel.name,
        { userId },
      );

      const usecase = new UseCase(logger, warningDepositRepository);
      const user = new UserEntity({ uuid: userId });

      const testScript = () => usecase.execute(null, user);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
