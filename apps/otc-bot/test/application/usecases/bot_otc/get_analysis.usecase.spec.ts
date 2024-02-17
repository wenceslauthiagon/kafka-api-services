import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  getMoment,
  defaultLogger as logger,
  MissingDataException,
} from '@zro/common';
import {
  GetBotOtcAnalysisUseCase as UseCase,
  OperationService,
  BotOtcNotFoundException,
  QuotationService,
} from '@zro/otc-bot/application';
import {
  BotOtcEntity,
  BotOtcOrderEntity,
  BotOtcOrderRepository,
  BotOtcOrderState,
  BotOtcRepository,
} from '@zro/otc-bot/domain';
import { BotOtcFactory, BotOtcOrderFactory } from '@zro/test/otc-bot/config';
import { CryptoMarketEntity, RemittanceEntity } from '@zro/otc/domain';
import { CryptoMarketFactory, RemittanceFactory } from '@zro/test/otc/config';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CurrencyEntity } from '@zro/operations/domain';
import { TaxEntity } from '@zro/quotations/domain';
import { TaxNotFoundException } from '@zro/quotations/application';
import { TaxFactory } from '@zro/test/quotations/config';

const remittanceCurrencyTag = 'REAL';
const remittanceCurrencyDecimals = 4;
const iofName = 'IOF';

describe('GetBotOtcAnalysisUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockCurrencyById: jest.Mock = On(operationService).get(
      method((mock) => mock.getCurrencyById),
    );

    const quotationService: QuotationService = createMock<QuotationService>();
    const mockGetTax: jest.Mock = On(quotationService).get(
      method((mock) => mock.getTaxByName),
    );

    return {
      operationService,
      mockCurrencyById,
      quotationService,
      mockGetTax,
    };
  };

  const mockRepository = () => {
    const botOtcOrderRepository: BotOtcOrderRepository =
      createMock<BotOtcOrderRepository>();
    const mockGetAllByFilterAndPagination: jest.Mock = On(
      botOtcOrderRepository,
    ).get(method((mock) => mock.getAllByFilterAndPagination));

    const botOtcRepository: BotOtcRepository = createMock<BotOtcRepository>();
    const mockGetBotOtcById: jest.Mock = On(botOtcRepository).get(
      method((mock) => mock.getById),
    );

    return {
      botOtcRepository,
      mockGetBotOtcById,
      botOtcOrderRepository,
      mockGetAllByFilterAndPagination,
    };
  };

  const makeSut = () => {
    const {
      botOtcRepository,
      mockGetBotOtcById,
      botOtcOrderRepository,
      mockGetAllByFilterAndPagination,
    } = mockRepository();

    const { operationService, mockCurrencyById, quotationService, mockGetTax } =
      mockService();

    const sut = new UseCase(
      logger,
      botOtcRepository,
      botOtcOrderRepository,
      operationService,
      quotationService,
      remittanceCurrencyTag,
      remittanceCurrencyDecimals,
      iofName,
    );

    return {
      sut,
      mockGetBotOtcById,
      mockGetAllByFilterAndPagination,
      mockCurrencyById,
      mockGetTax,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const {
        sut,
        mockGetBotOtcById,
        mockGetAllByFilterAndPagination,
        mockCurrencyById,
        mockGetTax,
      } = makeSut();

      const testScripts = [
        () => sut.execute(null, null, null),
        () => sut.execute(uuidV4(), null, null),
        () => sut.execute(null, getMoment().toDate(), null),
        () => sut.execute(null, null, getMoment().toDate()),
      ];

      for (const testScript of testScripts) {
        await expect(testScript).rejects.toThrow(MissingDataException);
        expect(mockGetBotOtcById).toHaveBeenCalledTimes(0);
        expect(mockGetAllByFilterAndPagination).toHaveBeenCalledTimes(0);
        expect(mockCurrencyById).toHaveBeenCalledTimes(0);
        expect(mockGetTax).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should throw BotOtcNotFoundException if no bot otc is found.', async () => {
      const {
        sut,
        mockGetBotOtcById,
        mockGetAllByFilterAndPagination,
        mockCurrencyById,
        mockGetTax,
      } = makeSut();

      mockGetBotOtcById.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(uuidV4(), getMoment().toDate(), getMoment().toDate());

      await expect(testScript).rejects.toThrow(BotOtcNotFoundException);
      expect(mockGetBotOtcById).toHaveBeenCalledTimes(1);
      expect(mockGetAllByFilterAndPagination).toHaveBeenCalledTimes(0);
      expect(mockCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetTax).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw TaxNotFoundException if no tax is found.', async () => {
      const {
        sut,
        mockGetBotOtcById,
        mockGetAllByFilterAndPagination,
        mockCurrencyById,
        mockGetTax,
      } = makeSut();

      const botOtc = await BotOtcFactory.create<BotOtcEntity>(
        BotOtcEntity.name,
      );

      mockGetBotOtcById.mockResolvedValue(botOtc);
      mockGetTax.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(uuidV4(), getMoment().toDate(), getMoment().toDate());

      await expect(testScript).rejects.toThrow(TaxNotFoundException);
      expect(mockGetBotOtcById).toHaveBeenCalledTimes(1);
      expect(mockGetAllByFilterAndPagination).toHaveBeenCalledTimes(0);
      expect(mockCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetTax).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should return if no bot otc order is found.', async () => {
      const {
        sut,
        mockGetBotOtcById,
        mockGetAllByFilterAndPagination,
        mockCurrencyById,
        mockGetTax,
      } = makeSut();

      const botOtc = await BotOtcFactory.create<BotOtcEntity>(
        BotOtcEntity.name,
      );

      const tax = await TaxFactory.create<TaxEntity>(TaxEntity.name);

      mockGetBotOtcById.mockResolvedValue(botOtc);
      mockGetTax.mockResolvedValue(tax);
      mockGetAllByFilterAndPagination.mockResolvedValue({
        data: [],
        page: 1,
        pageSize: 100,
        pageTotal: 0,
        total: 0,
      });

      const testScript = await sut.execute(
        botOtc.id,
        getMoment().toDate(),
        getMoment().toDate(),
      );

      expect(testScript).toBeUndefined();
      expect(mockGetBotOtcById).toHaveBeenCalledTimes(1);
      expect(mockGetAllByFilterAndPagination).toHaveBeenCalledTimes(1);
      expect(mockCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetTax).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should return if no bot otc order is found.', async () => {
      const {
        sut,
        mockGetBotOtcById,
        mockGetAllByFilterAndPagination,
        mockCurrencyById,
        mockGetTax,
      } = makeSut();

      const botOtc = await BotOtcFactory.create<BotOtcEntity>(
        BotOtcEntity.name,
      );

      const sellMarket = await CryptoMarketFactory.create<CryptoMarketEntity>(
        CryptoMarketEntity.name,
        {
          priceSignificantDigits: 8,
        },
      );

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        {
          decimal: 8,
        },
      );

      const buyRemittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        {
          bankQuote: 50000,
        },
      );

      const botOtcOrder1 = await BotOtcOrderFactory.create<BotOtcOrderEntity>(
        BotOtcOrderEntity.name,
        {
          baseCurrency,
          market: sellMarket,
          sellExecutedAmount: 100000000,
          sellExecutedPrice: 15000000000000,
          buyExecutedAmount: 100000000,
          buyExecutedPrice: 3000000000,
          buyPriceSignificantDigits: 5,
          buyRemittance,
          createdAt: getMoment().toDate(),
          state: BotOtcOrderState.COMPLETED,
        },
      );

      const tax = await TaxFactory.create<TaxEntity>(TaxEntity.name, {
        value: 38,
      });

      mockGetBotOtcById.mockResolvedValue(botOtc);
      mockGetTax.mockResolvedValue(tax);
      mockGetAllByFilterAndPagination.mockResolvedValue({
        data: [botOtcOrder1],
        page: 1,
        pageSize: 100,
        pageTotal: 0,
        total: 0,
      });
      mockCurrencyById.mockResolvedValue(baseCurrency);

      const result = await sut.execute(
        botOtc.id,
        getMoment().toDate(),
        getMoment().toDate(),
      );

      expect(result).toBeDefined();
      // Profit should be 150,000.0000 - (30,000.0000 * 5.0000 * 1.0038) = 570.0000
      expect(result.profit).toBe(-5700000);
      // Cost should be 150,000.0000 - profit
      expect(result.volume).toBe(1505700000);
      // Profit margin should be profit/cost
      expect(result.profitMargin).toBe(-38);
      expect(mockGetBotOtcById).toHaveBeenCalledTimes(1);
      expect(mockGetAllByFilterAndPagination).toHaveBeenCalledTimes(1);
      expect(mockCurrencyById).toHaveBeenCalledTimes(1);
      expect(mockGetTax).toHaveBeenCalledTimes(1);
    });
  });
});
