import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, PaginationEntity } from '@zro/common';
import { SpreadFactory } from '@zro/test/otc/config';
import { SpreadEntity, SpreadRepository } from '@zro/otc/domain';
import { GetAllSpreadUseCase } from '@zro/otc/application';

describe('GetAllSpreadUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const spreadRepository: SpreadRepository = createMock<SpreadRepository>();
  const mockGetAllSpreadRepository: jest.Mock = On(spreadRepository).get(
    method((mock) => mock.getAll),
  );

  describe('With valid parameters', () => {
    it('TC0001 - Should get spread successfully', async () => {
      const spreads = await SpreadFactory.createMany<SpreadEntity>(
        SpreadEntity.name,
        5,
      );

      const usecase = new GetAllSpreadUseCase(logger, spreadRepository);
      const pagination = new PaginationEntity({ pageSize: 2 });

      const data = spreads.slice(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize,
      );

      const page = {
        data,
        page: pagination.page,
        pageSize: pagination.pageSize,
        pageTotal: Math.ceil(spreads.length / pagination.pageSize),
        total: spreads.length,
      };

      mockGetAllSpreadRepository.mockResolvedValue(page);

      const result = await usecase.execute(pagination);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBe(spreads.length);
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res.id).toBeDefined();
        expect(res.sell).toBeDefined();
        expect(res.amount).toBeDefined();
        expect(res.buy).toBeDefined();
        expect(res.currency.id).toBeDefined();
        expect(res.currency.symbol).toBeDefined();
        expect(res.createdAt).toBeDefined();
      });
    });
  });
});
