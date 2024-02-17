import { Test, TestingModule } from '@nestjs/testing';
import { PaginationEntity, defaultLogger as logger } from '@zro/common';
import { StreamPairRepository } from '@zro/quotations/domain';
import { GetAllStreamPairUseCase as UseCase } from '@zro/quotations/application';
import {
  StreamPairDatabaseRepository,
  StreamPairModel,
} from '@zro/quotations/infrastructure';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { StreamPairFactory } from '@zro/test/quotations/config';

describe('GetAllStreamPairUseCase', () => {
  let module: TestingModule;
  let streamPairRepository: StreamPairRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    streamPairRepository = new StreamPairDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get stream pairs successfully', async () => {
      await StreamPairFactory.createMany<StreamPairModel>(
        StreamPairModel.name,
        2,
        { active: true, createdAt: new Date() },
      );

      const usecase = new UseCase(logger, streamPairRepository);
      const pagination = new PaginationEntity({ pageSize: 2 });

      const result = await usecase.execute(pagination, {});

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
        expect(res.active).toBeDefined();
        expect(res.baseCurrency.id).toBeDefined();
        expect(res.quoteCurrency.id).toBeDefined();
        expect(res.gatewayName).toBeDefined();
        expect(res.composedBy).toBeUndefined();
        expect(res.priority).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
