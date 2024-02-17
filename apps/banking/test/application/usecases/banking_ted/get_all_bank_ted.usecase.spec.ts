import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MissingDataException,
  PaginationEntity,
  defaultLogger as logger,
} from '@zro/common';
import { BankTedRepository } from '@zro/banking/domain';
import { GetAllBankTedUseCase as UseCase } from '@zro/banking/application';
import {
  BankTedDatabaseRepository,
  BankTedModel,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { BankTedFactory } from '@zro/test/banking/config';

describe('GetAllBankTedUseCase', () => {
  let module: TestingModule;
  let bankTedRepository: BankTedRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    bankTedRepository = new BankTedDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get bankTed successfully without filters', async () => {
      await BankTedFactory.createMany<BankTedModel>(BankTedModel.name, 2);

      const usecase = new UseCase(logger, bankTedRepository);

      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination);

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
        expect(res.code).toBeDefined();
        expect(res.active).toBeDefined();
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0002 - Should get just a filtered bankTed by name and active', async () => {
      const bankTed = await BankTedFactory.create<BankTedModel>(
        BankTedModel.name,
      );

      const usecase = new UseCase(logger, bankTedRepository);

      const pagination = new PaginationEntity();

      const result = await usecase.execute(
        pagination,
        bankTed.name,
        bankTed.active,
      );

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBe(1);
      expect(result.pageTotal).toBe(1);
      result.data.forEach((res) => {
        expect(res).toMatchObject(bankTed.toDomain());
      });
    });

    it('TC0003 - Should get just a filtered bankTed by name', async () => {
      const bankTed = await BankTedFactory.create<BankTedModel>(
        BankTedModel.name,
      );

      const usecase = new UseCase(logger, bankTedRepository);

      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination, bankTed.name);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBe(1);
      expect(result.pageTotal).toBe(1);
      result.data.forEach((res) => {
        expect(res).toMatchObject(bankTed.toDomain());
      });
    });

    it('TC0004 - Should get just a filtered bankTed by ispb', async () => {
      const bankTed = await BankTedFactory.create<BankTedModel>(
        BankTedModel.name,
      );

      const usecase = new UseCase(logger, bankTedRepository);

      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination, bankTed.ispb);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBe(1);
      expect(result.pageTotal).toBe(1);
      result.data.forEach((res) => {
        expect(res).toMatchObject(bankTed.toDomain());
      });
    });

    it('TC0005 - Should get only the filtered bankTeds by active', async () => {
      const active = false;
      await BankTedFactory.createMany<BankTedModel>(BankTedModel.name, 2, {
        active,
      });

      const usecase = new UseCase(logger, bankTedRepository);

      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination, null, active);

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
        expect(res.active).toBe(active);
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0006 - Should not get the filtered bankTed with different search', async () => {
      await BankTedFactory.create<BankTedModel>(BankTedModel.name);

      const usecase = new UseCase(logger, bankTedRepository);

      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination, uuidV4());

      expect(result).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBe(0);
      expect(result.pageTotal).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('TC0007 - Should not get the filtered bankTed with different active', async () => {
      const active = false;
      await BankTedFactory.create<BankTedModel>(BankTedModel.name, { active });

      const usecase = new UseCase(logger, bankTedRepository);

      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination, null, !active);

      expect(result).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      expect(result.data).toBeDefined();
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.active).toBe(!active);
        expect(res.createdAt).toBeDefined();
      });
    });
  });

  describe('With invalid parameters', () => {
    it('TC0009 - Should not get bankTed without pagination', async () => {
      const usecase = new UseCase(logger, bankTedRepository);

      const testScript = () => usecase.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
