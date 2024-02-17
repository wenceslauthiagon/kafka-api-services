import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  defaultLogger as logger,
  PaginationEntity,
  paginationToDomain,
} from '@zro/common';
import { GetAllRemittanceOrdersByFilterUseCase as UseCase } from '@zro/otc/application';
import {
  RemittanceOrderEntity,
  RemittanceOrderRemittanceEntity,
  RemittanceOrderRemittanceRepository,
  RemittanceOrderRepository,
  RemittanceStatus,
} from '@zro/otc/domain';
import {
  RemittanceOrderFactory,
  RemittanceOrderRemittanceFactory,
} from '@zro/test/otc/config';

describe('GetAllRemittanceOrdersByFilterUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRepository = () => {
    const remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository =
      createMock<RemittanceOrderRemittanceRepository>();

    const remittanceOrderRepository: RemittanceOrderRepository =
      createMock<RemittanceOrderRepository>();

    const mockGetAllRemittanceOrderRemittance: jest.Mock = On(
      remittanceOrderRemittanceRepository,
    ).get(method((mock) => mock.getAllByFilter));

    const mockGetAllRemittanceOrder: jest.Mock = On(
      remittanceOrderRepository,
    ).get(method((mock) => mock.getAllByFilter));

    return {
      remittanceOrderRemittanceRepository,
      remittanceOrderRepository,
      mockGetAllRemittanceOrderRemittance,
      mockGetAllRemittanceOrder,
    };
  };

  const makeSut = () => {
    const {
      remittanceOrderRemittanceRepository,
      remittanceOrderRepository,
      mockGetAllRemittanceOrderRemittance,
      mockGetAllRemittanceOrder,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      remittanceOrderRemittanceRepository,
      remittanceOrderRepository,
    );

    return {
      sut,
      mockGetAllRemittanceOrderRemittance,
      mockGetAllRemittanceOrder,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get remittance orders successfully.', async () => {
      const {
        sut,
        mockGetAllRemittanceOrderRemittance,
        mockGetAllRemittanceOrder,
      } = makeSut();

      const remittanceOrders =
        await RemittanceOrderFactory.createMany<RemittanceOrderEntity>(
          RemittanceOrderEntity.name,
          1,
        );

      const pagination = new PaginationEntity();
      const filter = {};

      mockGetAllRemittanceOrderRemittance.mockResolvedValue(
        paginationToDomain(pagination, 0, []),
      );

      mockGetAllRemittanceOrder.mockResolvedValue(
        paginationToDomain(
          pagination,
          remittanceOrders.length,
          remittanceOrders,
        ),
      );

      const result = await sut.execute(pagination, filter);

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
      });
      expect(mockGetAllRemittanceOrderRemittance).toHaveBeenCalledTimes(1);
      expect(mockGetAllRemittanceOrder).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should get remittance orders filtering by remittance successfully.', async () => {
      const {
        sut,
        mockGetAllRemittanceOrderRemittance,
        mockGetAllRemittanceOrder,
      } = makeSut();

      const remittanceOrderRemittances =
        await RemittanceOrderRemittanceFactory.createMany<RemittanceOrderRemittanceEntity>(
          RemittanceOrderRemittanceEntity.name,
          1,
        );

      const pagination = new PaginationEntity();
      const filter = { remittanceStatus: RemittanceStatus.CLOSED };

      mockGetAllRemittanceOrderRemittance.mockResolvedValue(
        paginationToDomain(
          pagination,
          remittanceOrderRemittances.length,
          remittanceOrderRemittances,
        ),
      );

      const result = await sut.execute(pagination, filter);

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
      });
      expect(mockGetAllRemittanceOrderRemittance).toHaveBeenCalledTimes(1);
      expect(mockGetAllRemittanceOrder).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should throw missing data exception if missing params.', async () => {
      const { sut, mockGetAllRemittanceOrderRemittance } = makeSut();

      const pagination = new PaginationEntity();
      const filter = {};

      const testScripts = [
        () => sut.execute(pagination, null),
        () => sut.execute(null, filter),
      ];

      for (const testScript of testScripts) {
        await expect(testScript).rejects.toThrow(MissingDataException);
        expect(mockGetAllRemittanceOrderRemittance).toHaveBeenCalledTimes(0);
      }
    });
  });
});
