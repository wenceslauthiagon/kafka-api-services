import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MissingDataException,
  PaginationEntity,
  PaginationOrder,
  defaultLogger as logger,
} from '@zro/common';
import { ExchangeContractRepository } from '@zro/otc/domain';
import { GetAllExchangeContractUseCase as UseCase } from '@zro/otc/application';
import {
  ExchangeContractDatabaseRepository,
  ExchangeContractModel,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ExchangeContractFactory } from '@zro/test/otc/config';

describe('GetAllExchangeContractUseCase', () => {
  let module: TestingModule;
  let exchangeContractRepository: ExchangeContractRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    exchangeContractRepository = new ExchangeContractDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should get exchange contracts successfully', async () => {
      await ExchangeContractFactory.createMany<ExchangeContractModel>(
        ExchangeContractModel.name,
        3,
        { createdAt: new Date() },
      );

      const usecase = new UseCase(logger, exchangeContractRepository);

      const pagination = new PaginationEntity({
        pageSize: 5,
        sort: 'created_at',
        order: PaginationOrder.DESC,
      });
      const filter = {};

      const result = await usecase.execute(pagination, filter);

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
        expect(res.contractNumber).toBeDefined();
        expect(res.vetQuote).toBeDefined();
        expect(res.contractQuote).toBeDefined();
        expect(res.totalAmount).toBeDefined();
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0002 - Should get exchange contracts successfully with nullable file id', async () => {
      await ExchangeContractFactory.createMany<ExchangeContractModel>(
        ExchangeContractModel.name,
        3,
        { fileId: null },
      );

      const usecase = new UseCase(logger, exchangeContractRepository);

      const pagination = new PaginationEntity({
        pageSize: 5,
        sort: 'created_at',
        order: PaginationOrder.DESC,
      });
      const filter = {};

      const result = await usecase.execute(pagination, filter);

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
        expect(res.contractNumber).toBeDefined();
        expect(res.vetQuote).toBeDefined();
        expect(res.contractQuote).toBeDefined();
        expect(res.totalAmount).toBeDefined();
        expect(res.file).toBeNull();
        expect(res.createdAt).toBeDefined();
      });
    });

    it('TC0003 - Should get exchange contracts successfully with certain search term', async () => {
      const exchangeContract =
        await ExchangeContractFactory.create<ExchangeContractModel>(
          ExchangeContractModel.name,
          { contractNumber: uuidV4() },
        );

      const usecase = new UseCase(logger, exchangeContractRepository);

      const pagination = new PaginationEntity();
      const filter = {};

      const result = await usecase.execute(
        pagination,
        filter,
        exchangeContract.contractNumber,
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
        expect(res.contractNumber).toBeDefined();
        expect(res.vetQuote).toBeDefined();
        expect(res.contractQuote).toBeDefined();
        expect(res.totalAmount).toBeDefined();
        expect(res.createdAt).toBeDefined();
      });
      expect(result.data.length).toBe(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0004 - Should throws a missing data exception without pagination', async () => {
      await ExchangeContractFactory.createMany<ExchangeContractModel>(
        ExchangeContractModel.name,
        3,
      );

      const usecase = new UseCase(logger, exchangeContractRepository);

      const filter = {};

      const testScript = () => usecase.execute(null, filter);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
