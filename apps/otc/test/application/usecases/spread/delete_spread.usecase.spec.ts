import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';

import { defaultLogger as logger } from '@zro/common';
import { CurrencyEntity } from '@zro/operations/domain';
import { SpreadRepository } from '@zro/otc/domain';
import {
  DeleteSpreadUseCase as UseCase,
  OperationService,
  SpreadEventEmitter,
} from '@zro/otc/application';
import { CurrencyFactory } from '@zro/test/operations/config';

describe('DeleteSpreadUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const eventEmitter: SpreadEventEmitter = createMock<SpreadEventEmitter>();
  const mockDeletedEventEmitter: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.deletedSpread),
  );

  const operationService: OperationService = createMock<OperationService>();
  const mockGetCurrencyOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyBySymbol),
  );

  const spreadRepository: SpreadRepository = createMock<SpreadRepository>();
  const mockDeleteByFilterSpreadRepository: jest.Mock = On(
    spreadRepository,
  ).get(method((mock) => mock.deleteByCurrency));

  describe('With valid parameters', () => {
    it('TC0001 - should delete spreads', async () => {
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      mockGetCurrencyOperationService.mockResolvedValue(currency);
      mockDeleteByFilterSpreadRepository.mockResolvedValue(1);

      const usecase = new UseCase(
        logger,
        spreadRepository,
        operationService,
        eventEmitter,
      );

      const base = new CurrencyEntity({ symbol: currency.symbol });

      await usecase.execute(base);

      expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(1);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockDeleteByFilterSpreadRepository).toHaveBeenCalledTimes(1);
      expect(mockDeletedEventEmitter.mock.calls[0][0]).toMatchObject({
        currency: base,
      });
      expect(mockDeleteByFilterSpreadRepository.mock.calls[0][0]).toMatchObject(
        currency,
      );
    });
  });
});
