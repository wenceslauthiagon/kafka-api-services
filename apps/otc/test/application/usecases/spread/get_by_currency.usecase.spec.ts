import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { SpreadFactory } from '@zro/test/otc/config';
import { SpreadEntity, SpreadRepository } from '@zro/otc/domain';
import { GetSpreadByCurrencyUseCase as UseCase } from '@zro/otc/application';

describe('GetSpreadByCurrencyUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const spreadRepository: SpreadRepository = createMock<SpreadRepository>();
  const mockGetSpreadByCurrencyRepository: jest.Mock = On(spreadRepository).get(
    method((mock) => mock.getByCurrency),
  );

  describe('With valid parameters', () => {
    it('TC0001 - Should get spread successfully', async () => {
      const spread = await SpreadFactory.create<SpreadEntity>(
        SpreadEntity.name,
        { offMarketTimeStart: '18:00', offMarketTimeEnd: '08:00' },
      );

      mockGetSpreadByCurrencyRepository.mockResolvedValue(spread);

      const usecase = new UseCase(logger, spreadRepository);

      const result = await usecase.execute(spread.currency);

      expect(result).toBeDefined();
      expect(result.id).toBe(spread.id);
      expect(result.buy).toBe(spread.buy);
      expect(result.sell).toBe(spread.sell);
      expect(result.offMarketBuy).toBe(spread.offMarketBuy);
      expect(result.offMarketSell).toBe(spread.offMarketSell);
      expect(result.offMarketTimeStart).toBe(spread.offMarketTimeStart);
      expect(result.offMarketTimeEnd).toBe(spread.offMarketTimeEnd);
      expect(mockGetSpreadByCurrencyRepository).toHaveBeenCalledTimes(1);
      expect(mockGetSpreadByCurrencyRepository.mock.calls[0][0]).toBe(
        spread.currency,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get spread without currency', async () => {
      const usecase = new UseCase(logger, spreadRepository);

      const testScript = () => usecase.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetSpreadByCurrencyRepository).toHaveBeenCalledTimes(0);
    });
  });
});
