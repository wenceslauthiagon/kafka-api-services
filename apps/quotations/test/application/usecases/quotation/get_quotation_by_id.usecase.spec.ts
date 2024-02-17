import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { QuotationRepository } from '@zro/quotations/domain';
import { GetQuotationByIdUseCase as UseCase } from '@zro/quotations/application';

describe('GetQuotationByIdUseCase', () => {
  const quotationRepository: QuotationRepository =
    createMock<QuotationRepository>();
  const getQuotation: jest.Mock = On(quotationRepository).get(
    method((mock) => mock.getById),
  );

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get quotation without params', async () => {
      const usecase = new UseCase(logger, quotationRepository);

      const testScript = () => usecase.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(getQuotation).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not get quotation without quotation', async () => {
      getQuotation.mockResolvedValue(null);

      const usecase = new UseCase(logger, quotationRepository);

      const result = await usecase.execute(uuidV4());

      expect(result).toBeNull();
      expect(getQuotation).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should get quotation', async () => {
      getQuotation.mockResolvedValue({});

      const usecase = new UseCase(logger, quotationRepository);

      const result = await usecase.execute(uuidV4());

      expect(result).toBeDefined();
      expect(getQuotation).toHaveBeenCalledTimes(1);
    });
  });
});
