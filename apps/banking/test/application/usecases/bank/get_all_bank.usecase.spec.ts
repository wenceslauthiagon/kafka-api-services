import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MissingDataException,
  PaginationEntity,
  defaultLogger as logger,
} from '@zro/common';
import { BankRepository } from '@zro/banking/domain';
import { GetAllBankUseCase as UseCase } from '@zro/banking/application';
import { BankDatabaseRepository, BankModel } from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { BankFactory } from '@zro/test/banking/config';

describe('GetAllBankUseCase', () => {
  let module: TestingModule;
  let bankRepository: BankRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    bankRepository = new BankDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get bank successfully without filters', async () => {
      await BankFactory.createMany<BankModel>(BankModel.name, 2);

      const usecase = new UseCase(logger, bankRepository);

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
        expect(res.active).toBeDefined();
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0002 - Should get just a filtered bank by name and active', async () => {
      const bank = await BankFactory.create<BankModel>(BankModel.name);

      const usecase = new UseCase(logger, bankRepository);

      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination, bank.name, bank.active);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBe(1);
      expect(result.pageTotal).toBe(1);
      result.data.forEach((res) => {
        expect(res).toMatchObject(bank.toDomain());
      });
    });

    it('TC0003 - Should get just a filtered bank by name', async () => {
      const bank = await BankFactory.create<BankModel>(BankModel.name);

      const usecase = new UseCase(logger, bankRepository);

      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination, bank.name);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBe(1);
      expect(result.pageTotal).toBe(1);
      result.data.forEach((res) => {
        expect(res).toMatchObject(bank.toDomain());
      });
    });

    it('TC0004 - Should get just a filtered bank by ispb', async () => {
      const bank = await BankFactory.create<BankModel>(BankModel.name);

      const usecase = new UseCase(logger, bankRepository);

      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination, bank.ispb);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBe(1);
      expect(result.pageTotal).toBe(1);
      result.data.forEach((res) => {
        expect(res).toMatchObject(bank.toDomain());
      });
    });

    it('TC0005 - Should get only the filtered banks by active', async () => {
      const active = false;
      await BankFactory.createMany<BankModel>(BankModel.name, 2, { active });

      const usecase = new UseCase(logger, bankRepository);

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

    it('TC0006 - Should not get the filtered bank with different search', async () => {
      await BankFactory.create<BankModel>(BankModel.name);

      const usecase = new UseCase(logger, bankRepository);

      const pagination = new PaginationEntity();

      const result = await usecase.execute(pagination, uuidV4());

      expect(result).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBe(0);
      expect(result.pageTotal).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('TC0007 - Should not get the filtered bank with different active', async () => {
      const active = false;
      await BankFactory.create<BankModel>(BankModel.name, { active });

      const usecase = new UseCase(logger, bankRepository);

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
    it('TC0009 - Should not get bank without pagination', async () => {
      const usecase = new UseCase(logger, bankRepository);

      const testScript = () => usecase.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
