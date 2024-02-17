import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  defaultLogger as logger,
  PaginationEntity,
  paginationToDomain,
} from '@zro/common';
import { GetAllBotOtcOrdersByFilterUseCase as UseCase } from '@zro/otc-bot/application';
import { BotOtcOrderEntity, BotOtcOrderRepository } from '@zro/otc-bot/domain';
import { BotOtcOrderFactory } from '@zro/test/otc-bot/config';

describe('GetAllBotOtcOrdersByFilterUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRepository = () => {
    const botOtcOrderRepository: BotOtcOrderRepository =
      createMock<BotOtcOrderRepository>();
    const mockGetAllByFilter: jest.Mock = On(botOtcOrderRepository).get(
      method((mock) => mock.getAllByFilter),
    );

    return {
      botOtcOrderRepository: botOtcOrderRepository,
      mockGetAllByFilter,
    };
  };

  const makeSut = () => {
    const { botOtcOrderRepository, mockGetAllByFilter } = mockRepository();

    const sut = new UseCase(logger, botOtcOrderRepository);

    return {
      sut,
      mockGetAllByFilter,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get bot otc orders successfully.', async () => {
      const { sut, mockGetAllByFilter } = makeSut();

      const remittanceOrders =
        await BotOtcOrderFactory.createMany<BotOtcOrderEntity>(
          BotOtcOrderEntity.name,
          1,
        );

      const pagination = new PaginationEntity();
      const filter = {};

      mockGetAllByFilter.mockResolvedValue(
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
      expect(mockGetAllByFilter).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw missing data exception if missing params.', async () => {
      const { sut, mockGetAllByFilter } = makeSut();

      const pagination = new PaginationEntity();
      const filter = {};

      const testScripts = [
        () => sut.execute(pagination, null),
        () => sut.execute(null, filter),
      ];

      for (const testScript of testScripts) {
        await expect(testScript).rejects.toThrow(MissingDataException);
        expect(mockGetAllByFilter).toHaveBeenCalledTimes(0);
      }
    });
  });
});
