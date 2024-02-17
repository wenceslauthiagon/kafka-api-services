import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  HandleFilledBotOtcOrderUseCase as UseCase,
  OtcService,
  BotOtcOrderEventEmitter,
  BotOtcOrderBuyOrderNotFoundException,
} from '@zro/otc-bot/application';
import {
  BotOtcOrderEntity,
  BotOtcOrderRepository,
  BotOtcOrderState,
} from '@zro/otc-bot/domain';
import { BotOtcOrderFactory } from '@zro/test/otc-bot/config';
import {
  CryptoOrderNotFoundException,
  CryptoRemittanceNotFoundException,
} from '@zro/otc/application';
import {
  CryptoMarketFactory,
  CryptoOrderFactory,
  CryptoRemittanceFactory,
  ProviderFactory,
} from '@zro/test/otc/config';
import {
  CryptoMarketEntity,
  CryptoOrderEntity,
  CryptoOrderState,
  CryptoRemittanceEntity,
  CryptoRemittanceStatus,
  ProviderEntity,
} from '@zro/otc/domain';

describe('HandleFilledBotOtcOrderUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockService = () => {
    const otcService: OtcService = createMock<OtcService>();
    const mockGetCryptoOrderById: jest.Mock = On(otcService).get(
      method((mock) => mock.getCryptoOrderById),
    );
    const mockGetCryptoRemittanceById: jest.Mock = On(otcService).get(
      method((mock) => mock.getCryptoRemittanceById),
    );

    return {
      otcService,
      mockGetCryptoOrderById,
      mockGetCryptoRemittanceById,
    };
  };

  const mockRepository = () => {
    const botOtcOrderRepository: BotOtcOrderRepository =
      createMock<BotOtcOrderRepository>();
    const mockGetAllByPaginationAndStateIn: jest.Mock = On(
      botOtcOrderRepository,
    ).get(method((mock) => mock.getAllByPaginationAndStateIn));
    const mockUpdateBotOtcOrder: jest.Mock = On(botOtcOrderRepository).get(
      method((mock) => mock.update),
    );

    return {
      botOtcOrderRepository,
      mockGetAllByPaginationAndStateIn,
      mockUpdateBotOtcOrder,
    };
  };

  const mockEmitter = () => {
    const botOtcOrderEventEmitter: BotOtcOrderEventEmitter =
      createMock<BotOtcOrderEventEmitter>();
    const mockEmitCompletedEvent: jest.Mock = On(botOtcOrderEventEmitter).get(
      method((mock) => mock.completedBotOtcOrder),
    );

    return {
      botOtcOrderEventEmitter,
      mockEmitCompletedEvent,
    };
  };

  const makeSut = () => {
    const {
      botOtcOrderRepository,
      mockGetAllByPaginationAndStateIn,
      mockUpdateBotOtcOrder,
    } = mockRepository();

    const { otcService, mockGetCryptoOrderById, mockGetCryptoRemittanceById } =
      mockService();

    const { botOtcOrderEventEmitter, mockEmitCompletedEvent } = mockEmitter();

    const sut = new UseCase(
      logger,
      botOtcOrderRepository,
      otcService,
      botOtcOrderEventEmitter,
    );

    return {
      sut,
      mockGetAllByPaginationAndStateIn,
      mockUpdateBotOtcOrder,
      mockGetCryptoOrderById,
      mockEmitCompletedEvent,
      mockGetCryptoRemittanceById,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should return if no filled bot otc order is found.', async () => {
      const {
        sut,
        mockGetAllByPaginationAndStateIn,
        mockUpdateBotOtcOrder,
        mockGetCryptoOrderById,
        mockEmitCompletedEvent,
        mockGetCryptoRemittanceById,
      } = makeSut();

      mockGetAllByPaginationAndStateIn.mockResolvedValue({
        data: [],
        page: 1,
        pageSize: 100,
        pageTotal: 0,
        total: 0,
      });

      await sut.execute();

      expect(mockGetAllByPaginationAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoOrderById).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoRemittanceById).toHaveBeenCalledTimes(0);
      expect(mockEmitCompletedEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not continue if found order state is not FILLED.', async () => {
      const {
        sut,
        mockGetAllByPaginationAndStateIn,
        mockUpdateBotOtcOrder,
        mockGetCryptoOrderById,
        mockEmitCompletedEvent,
        mockGetCryptoRemittanceById,
      } = makeSut();

      const botOtcOrder = await BotOtcOrderFactory.create<BotOtcOrderEntity>(
        BotOtcOrderEntity.name,
        {
          state: BotOtcOrderState.COMPLETED,
        },
      );

      mockGetAllByPaginationAndStateIn.mockResolvedValue({
        data: [botOtcOrder],
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 1,
      });

      await sut.execute();

      expect(mockGetAllByPaginationAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoOrderById).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoRemittanceById).toHaveBeenCalledTimes(0);
      expect(mockEmitCompletedEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw BotOtcOrderBuyOrderNotFoundException if bot otc order has no buy order.', async () => {
      const {
        sut,
        mockGetAllByPaginationAndStateIn,
        mockUpdateBotOtcOrder,
        mockGetCryptoOrderById,
        mockEmitCompletedEvent,
        mockGetCryptoRemittanceById,
      } = makeSut();

      const botOtcOrder = await BotOtcOrderFactory.create<BotOtcOrderEntity>(
        BotOtcOrderEntity.name,
        {
          state: BotOtcOrderState.FILLED,
          buyOrder: null,
        },
      );

      mockGetAllByPaginationAndStateIn.mockResolvedValue({
        data: [botOtcOrder],
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 1,
      });

      const testScript = () => sut.execute();

      await expect(testScript).rejects.toThrow(
        BotOtcOrderBuyOrderNotFoundException,
      );
      expect(mockGetAllByPaginationAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoOrderById).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoRemittanceById).toHaveBeenCalledTimes(0);
      expect(mockEmitCompletedEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw CryptoOrderNotFoundException if crypto order is not found.', async () => {
      const {
        sut,
        mockGetAllByPaginationAndStateIn,
        mockUpdateBotOtcOrder,
        mockGetCryptoOrderById,
        mockEmitCompletedEvent,
        mockGetCryptoRemittanceById,
      } = makeSut();

      const botOtcOrder = await BotOtcOrderFactory.create<BotOtcOrderEntity>(
        BotOtcOrderEntity.name,
        {
          state: BotOtcOrderState.FILLED,
        },
      );

      mockGetAllByPaginationAndStateIn.mockResolvedValue({
        data: [botOtcOrder],
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 1,
      });
      mockGetCryptoOrderById.mockResolvedValue(null);

      const testScript = () => sut.execute();

      await expect(testScript).rejects.toThrow(CryptoOrderNotFoundException);
      expect(mockGetAllByPaginationAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoOrderById).toHaveBeenCalledTimes(1);
      expect(mockGetCryptoRemittanceById).toHaveBeenCalledTimes(0);
      expect(mockEmitCompletedEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not update if found crypto order state is not CONFIRMED.', async () => {
      const {
        sut,
        mockGetAllByPaginationAndStateIn,
        mockUpdateBotOtcOrder,
        mockGetCryptoOrderById,
        mockEmitCompletedEvent,
        mockGetCryptoRemittanceById,
      } = makeSut();

      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
        {
          state: CryptoOrderState.PENDING,
        },
      );

      const botOtcOrder = await BotOtcOrderFactory.create<BotOtcOrderEntity>(
        BotOtcOrderEntity.name,
        {
          state: BotOtcOrderState.FILLED,
          buyOrder: cryptoOrder,
        },
      );

      mockGetAllByPaginationAndStateIn.mockResolvedValue({
        data: [botOtcOrder],
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 1,
      });
      mockGetCryptoOrderById.mockResolvedValue(cryptoOrder);

      await sut.execute();

      expect(mockGetAllByPaginationAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoOrderById).toHaveBeenCalledTimes(1);
      expect(mockGetCryptoRemittanceById).toHaveBeenCalledTimes(0);
      expect(mockEmitCompletedEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should throw CryptoRemittanceNotFoundException if crypto remittance is not found.', async () => {
      const {
        sut,
        mockGetAllByPaginationAndStateIn,
        mockUpdateBotOtcOrder,
        mockGetCryptoOrderById,
        mockEmitCompletedEvent,
        mockGetCryptoRemittanceById,
      } = makeSut();

      const cryptoRemittance =
        await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
          CryptoRemittanceEntity.name,
          {
            status: CryptoRemittanceStatus.PENDING,
          },
        );

      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
        {
          state: CryptoOrderState.CONFIRMED,
          cryptoRemittance,
        },
      );

      const botOtcOrder = await BotOtcOrderFactory.create<BotOtcOrderEntity>(
        BotOtcOrderEntity.name,
        {
          state: BotOtcOrderState.FILLED,
          buyOrder: cryptoOrder,
        },
      );

      mockGetAllByPaginationAndStateIn.mockResolvedValue({
        data: [botOtcOrder],
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 1,
      });
      mockGetCryptoOrderById.mockResolvedValue(cryptoOrder);
      mockGetCryptoRemittanceById.mockResolvedValue(null);

      const testScript = () => sut.execute();

      await expect(testScript).rejects.toThrow(
        CryptoRemittanceNotFoundException,
      );
      expect(mockGetAllByPaginationAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoOrderById).toHaveBeenCalledTimes(1);
      expect(mockEmitCompletedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoRemittanceById).toHaveBeenCalledTimes(1);
    });

    it('TC0007 - Should not update if found crypto remittance status is not FILLED.', async () => {
      const {
        sut,
        mockGetAllByPaginationAndStateIn,
        mockUpdateBotOtcOrder,
        mockGetCryptoOrderById,
        mockEmitCompletedEvent,
        mockGetCryptoRemittanceById,
      } = makeSut();

      const cryptoRemittance =
        await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
          CryptoRemittanceEntity.name,
          {
            status: CryptoRemittanceStatus.PENDING,
          },
        );

      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
        {
          state: CryptoOrderState.CONFIRMED,
          cryptoRemittance,
        },
      );

      const botOtcOrder = await BotOtcOrderFactory.create<BotOtcOrderEntity>(
        BotOtcOrderEntity.name,
        {
          state: BotOtcOrderState.FILLED,
          buyOrder: cryptoOrder,
        },
      );

      mockGetAllByPaginationAndStateIn.mockResolvedValue({
        data: [botOtcOrder],
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 1,
      });
      mockGetCryptoOrderById.mockResolvedValue(cryptoOrder);
      mockGetCryptoRemittanceById.mockResolvedValue(cryptoRemittance);

      await sut.execute();

      expect(mockGetAllByPaginationAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoOrderById).toHaveBeenCalledTimes(1);
      expect(mockEmitCompletedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoRemittanceById).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0008 - Should update bot otc order to completed successfully.', async () => {
      const {
        sut,
        mockGetAllByPaginationAndStateIn,
        mockUpdateBotOtcOrder,
        mockGetCryptoOrderById,
        mockEmitCompletedEvent,
        mockGetCryptoRemittanceById,
      } = makeSut();

      const market = await CryptoMarketFactory.create<CryptoMarketEntity>(
        CryptoMarketEntity.name,
        {
          priceSignificantDigits: 5,
        },
      );

      const toProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: market.providerName,
        },
      );

      const cryptoRemittance =
        await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
          CryptoRemittanceEntity.name,
          {
            status: CryptoRemittanceStatus.FILLED,
            market,
            provider: toProvider,
          },
        );

      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
        {
          state: CryptoOrderState.CONFIRMED,
          cryptoRemittance,
        },
      );

      const botOtcOrder = await BotOtcOrderFactory.create<BotOtcOrderEntity>(
        BotOtcOrderEntity.name,
        {
          state: BotOtcOrderState.FILLED,
          buyOrder: cryptoOrder,
        },
      );

      mockGetAllByPaginationAndStateIn.mockResolvedValue({
        data: [botOtcOrder],
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 1,
      });
      mockGetCryptoOrderById.mockResolvedValue(cryptoOrder);
      mockGetCryptoRemittanceById.mockResolvedValue(cryptoRemittance);

      await sut.execute();

      expect(mockGetAllByPaginationAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtcOrder).toHaveBeenCalledTimes(1);
      expect(mockGetCryptoOrderById).toHaveBeenCalledTimes(1);
      expect(mockEmitCompletedEvent).toHaveBeenCalledTimes(1);
      expect(mockGetCryptoRemittanceById).toHaveBeenCalledTimes(1);
    });
  });
});
