import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  RunSpreadBotUseCase as UseCase,
  OperationService,
  QuotationService,
  OtcService,
  BotOtcNotFoundException,
  BotOtcConfigurationFailedException,
} from '@zro/otc-bot/application';
import {
  BotOtcControl,
  BotOtcEntity,
  BotOtcOrderEntity,
  BotOtcOrderRepository,
  BotOtcOrderState,
  BotOtcRepository,
} from '@zro/otc-bot/domain';
import {
  CryptoMarketNotFoundException,
  CryptoRemittanceAmountUnderflowException,
  CryptoRemittanceGateway,
  CryptoRemittanceInvalidNotionalException,
  ProviderNotFoundException,
} from '@zro/otc/application';
import { BotOtcFactory, BotOtcOrderFactory } from '@zro/test/otc-bot/config';
import { StreamPairNotFoundException } from '@zro/quotations/application';
import {
  StreamPairFactory,
  StreamQuotationFactory,
} from '@zro/test/quotations/config';
import {
  StreamPairEntity,
  StreamQuotationEntity,
} from '@zro/quotations/domain';
import { CryptoMarketEntity, ProviderEntity } from '@zro/otc/domain';
import { CryptoMarketFactory, ProviderFactory } from '@zro/test/otc/config';
import { CurrencyNotFoundException } from '@zro/operations/application';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CurrencyEntity } from '@zro/operations/domain';

describe('RunSpreadBotUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockService = () => {
    const quotationService: QuotationService = createMock<QuotationService>();
    const mockGetStreamPairById: jest.Mock = On(quotationService).get(
      method((mock) => mock.getStreamPairById),
    );
    const mockGetStreamQuotationByBaseAndQuoteAndGatewayName: jest.Mock = On(
      quotationService,
    ).get(
      method((mock) => mock.getStreamQuotationByBaseAndQuoteAndGatewayName),
    );

    const otcService: OtcService = createMock<OtcService>();
    const mockGetProviderById: jest.Mock = On(otcService).get(
      method((mock) => mock.getProviderById),
    );

    const operationService: OperationService = createMock<OperationService>();
    const mockGetCurrencyById: jest.Mock = On(operationService).get(
      method((mock) => mock.getCurrencyById),
    );

    return {
      quotationService,
      mockGetStreamPairById,
      mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      otcService,
      mockGetProviderById,
      operationService,
      mockGetCurrencyById,
    };
  };

  const mockGateways = () => {
    const cryptoRemittanceGateway: CryptoRemittanceGateway =
      createMock<CryptoRemittanceGateway>();
    const mockGetProviderName: jest.Mock = On(cryptoRemittanceGateway).get(
      method((mock) => mock.getProviderName),
    );
    const mockGetCryptoMarketByBaseAndQuote: jest.Mock = On(
      cryptoRemittanceGateway,
    ).get(method((mock) => mock.getCryptoMarketByBaseAndQuote));
    const mockCreateCryptoRemittance: jest.Mock = On(
      cryptoRemittanceGateway,
    ).get(method((mock) => mock.createCryptoRemittance));

    return {
      cryptoRemittanceGateway,
      mockGetProviderName,
      mockGetCryptoMarketByBaseAndQuote,
      mockCreateCryptoRemittance,
    };
  };

  const mockRepository = () => {
    const botOtcRepository: BotOtcRepository = createMock<BotOtcRepository>();
    const mockGetByByIdBotOtc: jest.Mock = On(botOtcRepository).get(
      method((mock) => mock.getById),
    );
    const mockUpdateBotOtc: jest.Mock = On(botOtcRepository).get(
      method((mock) => mock.update),
    );

    const botOtcOrderRepository: BotOtcOrderRepository =
      createMock<BotOtcOrderRepository>();
    const mockGetAllByBotOtcAndStateIn: jest.Mock = On(
      botOtcOrderRepository,
    ).get(method((mock) => mock.getAllByBotOtcAndStateIn));
    const mockCreateBotOtcOrder: jest.Mock = On(botOtcOrderRepository).get(
      method((mock) => mock.create),
    );

    return {
      botOtcRepository,
      mockGetByByIdBotOtc,
      mockUpdateBotOtc,
      botOtcOrderRepository,
      mockGetAllByBotOtcAndStateIn,
      mockCreateBotOtcOrder,
    };
  };

  const makeSut = () => {
    const {
      cryptoRemittanceGateway,
      mockGetProviderName,
      mockGetCryptoMarketByBaseAndQuote,
      mockCreateCryptoRemittance,
    } = mockGateways();

    const cryptoRemittanceGateways = [
      cryptoRemittanceGateway,
      cryptoRemittanceGateway,
    ];

    const {
      botOtcRepository,
      mockGetByByIdBotOtc,
      mockUpdateBotOtc,
      botOtcOrderRepository,
      mockGetAllByBotOtcAndStateIn,
      mockCreateBotOtcOrder,
    } = mockRepository();

    const {
      quotationService,
      mockGetStreamPairById,
      mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      otcService,
      mockGetProviderById,
      operationService,
      mockGetCurrencyById,
    } = mockService();

    const sut = new UseCase(
      logger,
      botOtcRepository,
      botOtcOrderRepository,
      quotationService,
      otcService,
      operationService,
      cryptoRemittanceGateways,
    );

    return {
      sut,
      mockGetByByIdBotOtc,
      mockUpdateBotOtc,
      mockGetAllByBotOtcAndStateIn,
      mockCreateBotOtcOrder,
      mockGetStreamPairById,
      mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      mockGetProviderById,
      mockGetCurrencyById,
      mockGetProviderName,
      mockGetCryptoMarketByBaseAndQuote,
      mockCreateCryptoRemittance,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(0);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(0);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(0);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetProviderName).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw BotOtcNotFoundException if bot is not found.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name);

      mockGetByByIdBotOtc.mockResolvedValue(null);

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(BotOtcNotFoundException);
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(0);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(0);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetProviderName).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should return if finds orders in process.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name);

      const botOrder = await BotOtcOrderFactory.create<BotOtcOrderEntity>(
        BotOtcOrderEntity.name,
        {
          state: BotOtcOrderState.PENDING,
        },
      );

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([botOrder]);

      const testScript = await sut.execute(bot);

      expect(testScript).toBeUndefined();
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(0);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetProviderName).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw StreamPairNotFoundException if no from pair is found.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name);

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValue(null);

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(StreamPairNotFoundException);
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(1);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetProviderName).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw StreamPairNotFoundException if no to pair is found.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name);

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(StreamPairNotFoundException);
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetProviderName).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should throw ProviderNotFoundException if no from provider is found.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name);

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(ProviderNotFoundException);
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetProviderName).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should throw BotOtcConfigurationFailedException if no from gateway provider name is found.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name);

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );

      const fromProvider = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValue('');

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(
        BotOtcConfigurationFailedException,
      );
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should throw ProviderNotFoundException if no to provider is found.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name);

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );

      const fromProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'B2C2',
        },
      );

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValueOnce('B2C2');
      mockGetProviderById.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(ProviderNotFoundException);
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should throw BotOtcConfigurationFailedException if no to gateway provider name is found.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name);

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );

      const fromProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'B2C2',
        },
      );

      const toProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'BINANCE',
        },
      );

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValueOnce('B2C2');
      mockGetProviderById.mockResolvedValueOnce(toProvider);

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(
        BotOtcConfigurationFailedException,
      );
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0010 - Should throw BotOtcConfigurationFailedException if From Pair gateway name diverges From Provider name.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );

      const fromProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'B2C2',
        },
      );

      const toProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'BINANCE',
        },
      );

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        fromPair,
        toPair,
        fromProvider,
        toProvider,
      });

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValueOnce('B2C2');
      mockGetProviderById.mockResolvedValueOnce(toProvider);
      mockGetProviderName.mockReturnValueOnce('BINANCE');

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(
        BotOtcConfigurationFailedException,
      );
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0011 - Should throw BotOtcConfigurationFailedException if To Pair gateway name diverges To Provider name.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'B2C2',
        },
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );

      const fromProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'B2C2',
        },
      );

      const toProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'BINANCE',
        },
      );

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        fromPair,
        toPair,
        fromProvider,
        toProvider,
      });

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValueOnce('B2C2');
      mockGetProviderById.mockResolvedValueOnce(toProvider);
      mockGetProviderName.mockReturnValueOnce('BINANCE');

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(
        BotOtcConfigurationFailedException,
      );
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0012 - Should throw BotOtcConfigurationFailedException if From Pair is not active.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'B2C2',
          active: false,
        },
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'BINANCE',
        },
      );

      const fromProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'B2C2',
        },
      );

      const toProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'BINANCE',
        },
      );

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        fromPair,
        toPair,
        fromProvider,
        toProvider,
      });

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValueOnce('B2C2');
      mockGetProviderById.mockResolvedValueOnce(toProvider);
      mockGetProviderName.mockReturnValueOnce('BINANCE');

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(
        BotOtcConfigurationFailedException,
      );
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0013 - Should throw BotOtcConfigurationFailedException if To Pair is not active.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'B2C2',
          active: true,
        },
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'BINANCE',
          active: false,
        },
      );

      const fromProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'B2C2',
        },
      );

      const toProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'BINANCE',
        },
      );

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        fromPair,
        toPair,
        fromProvider,
        toProvider,
      });

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValueOnce('B2C2');
      mockGetProviderById.mockResolvedValueOnce(toProvider);
      mockGetProviderName.mockReturnValueOnce('BINANCE');

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(
        BotOtcConfigurationFailedException,
      );
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0014 - Should return if bot has no balance.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        balance: 0,
      });

      mockGetByByIdBotOtc.mockResolvedValue(bot);

      const testScript = await sut.execute(bot);

      expect(testScript).toBeUndefined();
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(0);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(0);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetProviderName).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0015 - Should return if bot balance is lower than its step.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        balance: 10,
        step: 100,
      });

      mockGetByByIdBotOtc.mockResolvedValue(bot);

      const testScript = await sut.execute(bot);

      expect(testScript).toBeUndefined();
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(0);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(0);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      expect(mockGetProviderName).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0016 - Should throw CurrencyNotFound if from base currency is not found.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'B2C2',
          active: true,
        },
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'BINANCE',
          active: true,
        },
      );

      const fromProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'B2C2',
        },
      );

      const toProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'BINANCE',
        },
      );

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        fromPair,
        toPair,
        fromProvider,
        toProvider,
        balance: 10000,
        step: 10000,
      });

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValueOnce('B2C2');
      mockGetProviderById.mockResolvedValueOnce(toProvider);
      mockGetProviderName.mockReturnValueOnce('BINANCE');
      mockGetCurrencyById.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(CurrencyNotFoundException);
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(1);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0017 - Should throw CurrencyNotFound if from quote currency is not found.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'B2C2',
          active: true,
        },
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'BINANCE',
          active: true,
        },
      );

      const fromProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'B2C2',
        },
      );

      const toProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'BINANCE',
        },
      );

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        fromPair,
        toPair,
        fromProvider,
        toProvider,
        balance: 10000,
        step: 10000,
      });

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValueOnce('B2C2');
      mockGetProviderById.mockResolvedValueOnce(toProvider);
      mockGetProviderName.mockReturnValueOnce('BINANCE');
      mockGetCurrencyById.mockResolvedValueOnce(bot.fromPair.baseCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(CurrencyNotFoundException);
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(2);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0018 - Should throw CurrencyNotFound if to base currency is not found.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'B2C2',
          active: true,
        },
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'BINANCE',
          active: true,
        },
      );

      const fromProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'B2C2',
        },
      );

      const toProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'BINANCE',
        },
      );

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        fromPair,
        toPair,
        fromProvider,
        toProvider,
        balance: 10000,
        step: 10000,
      });

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValueOnce('B2C2');
      mockGetProviderById.mockResolvedValueOnce(toProvider);
      mockGetProviderName.mockReturnValueOnce('BINANCE');
      mockGetCurrencyById.mockResolvedValueOnce(bot.fromPair.baseCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.fromPair.quoteCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(CurrencyNotFoundException);
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(3);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0019 - Should throw CurrencyNotFound if to quote currency is not found.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'B2C2',
          active: true,
        },
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'BINANCE',
          active: true,
        },
      );

      const fromProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'B2C2',
        },
      );

      const toProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'BINANCE',
        },
      );

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        fromPair,
        toPair,
        fromProvider,
        toProvider,
        balance: 10000,
        step: 10000,
      });

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValueOnce('B2C2');
      mockGetProviderById.mockResolvedValueOnce(toProvider);
      mockGetProviderName.mockReturnValueOnce('BINANCE');
      mockGetCurrencyById.mockResolvedValueOnce(bot.fromPair.baseCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.fromPair.quoteCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.toPair.baseCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(CurrencyNotFoundException);
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(4);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0020 - Should return if no stream quotation is not found.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'B2C2',
          active: true,
        },
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'BINANCE',
          active: true,
        },
      );

      const fromProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'B2C2',
        },
      );

      const toProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'BINANCE',
        },
      );

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        fromPair,
        toPair,
        fromProvider,
        toProvider,
        balance: 10000,
        step: 10000,
      });

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValueOnce('B2C2');
      mockGetProviderById.mockResolvedValueOnce(toProvider);
      mockGetProviderName.mockReturnValueOnce('BINANCE');
      mockGetCurrencyById.mockResolvedValueOnce(bot.fromPair.baseCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.fromPair.quoteCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.toPair.baseCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.toPair.quoteCurrency);
      mockGetStreamQuotationByBaseAndQuoteAndGatewayName.mockResolvedValueOnce(
        null,
      );

      const testScript = await sut.execute(bot);

      expect(testScript).toBeUndefined();
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(4);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0021 - Should throw CryptoMarketNotFoundException if no to market is not found.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'B2C2',
          active: true,
        },
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'BINANCE',
          active: true,
        },
      );

      const fromProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'B2C2',
        },
      );

      const toProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'BINANCE',
        },
      );

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        fromPair,
        toPair,
        fromProvider,
        toProvider,
        balance: 10000,
        step: 10000,
      });

      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
        );

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValueOnce('B2C2');
      mockGetProviderById.mockResolvedValueOnce(toProvider);
      mockGetProviderName.mockReturnValueOnce('BINANCE');
      mockGetCurrencyById.mockResolvedValueOnce(bot.fromPair.baseCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.fromPair.quoteCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.toPair.baseCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.toPair.quoteCurrency);
      mockGetStreamQuotationByBaseAndQuoteAndGatewayName.mockResolvedValueOnce(
        streamQuotation,
      );
      mockGetCryptoMarketByBaseAndQuote.mockReturnValueOnce(null);

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(CryptoMarketNotFoundException);
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(4);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0022 - Should throw CryptoRemittanceAmountUnderflowException if amount <= 0 or lower than market minimum size.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'B2C2',
          active: true,
        },
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'BINANCE',
          active: true,
        },
      );

      const fromProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'B2C2',
        },
      );

      const toProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'BINANCE',
        },
      );

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        fromPair,
        toPair,
        fromProvider,
        toProvider,
        balance: 10000,
        step: 90, // amount(step) < sizeIncrement
        spread: 100,
      });

      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          {
            buy: 1000.0,
            sell: 900.0,
            baseCurrency: bot.fromPair.baseCurrency,
            quoteCurrency: bot.fromPair.quoteCurrency,
            gatewayName: bot.fromPair.gatewayName,
          },
        );

      const toMarket = await CryptoMarketFactory.create<CryptoMarketEntity>(
        CryptoMarketEntity.name,
        {
          baseCurrency: bot.toPair.baseCurrency,
          quoteCurrency: bot.toPair.quoteCurrency,
          maxSize: 900000000,
          sizeIncrement: 100,
          minSize: 10000,
        },
      );

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValueOnce('B2C2');
      mockGetProviderById.mockResolvedValueOnce(toProvider);
      mockGetProviderName.mockReturnValueOnce('BINANCE');
      mockGetCurrencyById.mockResolvedValueOnce(bot.fromPair.baseCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.fromPair.quoteCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.toPair.baseCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.toPair.quoteCurrency);
      mockGetStreamQuotationByBaseAndQuoteAndGatewayName.mockResolvedValueOnce(
        streamQuotation,
      );
      mockGetCryptoMarketByBaseAndQuote.mockReturnValueOnce(toMarket);

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(
        CryptoRemittanceAmountUnderflowException,
      );
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(4);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0023 - Should throw CryptoRemittanceInvalidNotionalException if notional is not valid for to market notional rules.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        {
          decimal: 8,
        },
      );

      const quoteCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        {
          decimal: 2,
        },
      );

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'B2C2',
          active: true,
          baseCurrency,
          quoteCurrency,
        },
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'BINANCE',
          active: true,
          baseCurrency,
          quoteCurrency,
        },
      );

      const fromProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'B2C2',
        },
      );

      const toProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'BINANCE',
        },
      );

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        fromPair,
        toPair,
        fromProvider,
        toProvider,
        balance: 10000,
        step: 10000,
        spread: 100,
      });

      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          {
            buy: 99000.0,
            sell: 98000.0,
            baseCurrency,
            quoteCurrency,
            gatewayName: bot.fromPair.gatewayName,
          },
        );

      const toMarket = await CryptoMarketFactory.create<CryptoMarketEntity>(
        CryptoMarketEntity.name,
        {
          baseCurrency,
          quoteCurrency,
          sizeIncrement: 1000,
          priceSignificantDigits: 8,
          minNotional: 1000000000,
        },
      );

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValueOnce('B2C2');
      mockGetProviderById.mockResolvedValueOnce(toProvider);
      mockGetProviderName.mockReturnValueOnce('BINANCE');
      mockGetCurrencyById.mockResolvedValueOnce(bot.fromPair.baseCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.fromPair.quoteCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.toPair.baseCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.toPair.quoteCurrency);
      mockGetStreamQuotationByBaseAndQuoteAndGatewayName.mockResolvedValueOnce(
        streamQuotation,
      );
      mockGetCryptoMarketByBaseAndQuote.mockReturnValueOnce(toMarket);

      const testScript = () => sut.execute(bot);

      await expect(testScript).rejects.toThrow(
        CryptoRemittanceInvalidNotionalException,
      );
      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(0);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(4);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(0);
    });

    it('TC0024 - Should return if bot control is STOP.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        control: BotOtcControl.STOP,
      });

      mockGetByByIdBotOtc.mockResolvedValue(bot);

      const testScript = await sut.execute(bot);

      expect(testScript).toBeUndefined();
      expect(mockGetByByIdBotOtc).toBeCalledTimes(1);
      expect(mockUpdateBotOtc).toBeCalledTimes(0);
      expect(mockGetAllByBotOtcAndStateIn).toBeCalledTimes(0);
      expect(mockCreateBotOtcOrder).toBeCalledTimes(0);
      expect(mockGetStreamPairById).toBeCalledTimes(0);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toBeCalledTimes(0);
      expect(mockGetProviderById).toBeCalledTimes(0);
      expect(mockGetCurrencyById).toBeCalledTimes(0);
      expect(mockGetProviderName).toBeCalledTimes(0);
      expect(mockGetCryptoMarketByBaseAndQuote).toBeCalledTimes(0);
      expect(mockCreateCryptoRemittance).toBeCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0025 - Should create pending order successfully.', async () => {
      const {
        sut,
        mockGetByByIdBotOtc,
        mockUpdateBotOtc,
        mockGetAllByBotOtcAndStateIn,
        mockCreateBotOtcOrder,
        mockGetStreamPairById,
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
        mockGetProviderById,
        mockGetCurrencyById,
        mockGetProviderName,
        mockGetCryptoMarketByBaseAndQuote,
        mockCreateCryptoRemittance,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        {
          decimal: 8,
        },
      );

      const quoteCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        {
          decimal: 2,
        },
      );

      const fromPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'B2C2',
          active: true,
          baseCurrency,
          quoteCurrency,
        },
      );

      const toPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          gatewayName: 'BINANCE',
          active: true,
          baseCurrency,
          quoteCurrency,
        },
      );

      const fromProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'B2C2',
        },
      );

      const toProvider = await ProviderFactory.create<ProviderEntity>(
        ProviderEntity.name,
        {
          name: 'BINANCE',
        },
      );

      const bot = await BotOtcFactory.create<BotOtcEntity>(BotOtcEntity.name, {
        fromPair,
        toPair,
        fromProvider,
        toProvider,
        balance: 10000,
        step: 10000,
        spread: 100,
      });

      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          {
            buy: 101000.0,
            sell: 99000.0,
            baseCurrency,
            quoteCurrency,
            gatewayName: bot.fromPair.gatewayName,
          },
        );

      const toMarket = await CryptoMarketFactory.create<CryptoMarketEntity>(
        CryptoMarketEntity.name,
        {
          baseCurrency,
          quoteCurrency,
          sizeIncrement: 1000,
          priceSignificantDigits: 8,
          minNotional: 1000000000,
          minSize: 1000,
        },
      );

      mockGetByByIdBotOtc.mockResolvedValue(bot);
      mockGetAllByBotOtcAndStateIn.mockResolvedValue([]);
      mockGetStreamPairById.mockResolvedValueOnce(fromPair);
      mockGetStreamPairById.mockResolvedValueOnce(toPair);
      mockGetProviderById.mockResolvedValueOnce(fromProvider);
      mockGetProviderName.mockReturnValueOnce('B2C2');
      mockGetProviderById.mockResolvedValueOnce(toProvider);
      mockGetProviderName.mockReturnValueOnce('BINANCE');
      mockGetCurrencyById.mockResolvedValueOnce(bot.fromPair.baseCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.fromPair.quoteCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.toPair.baseCurrency);
      mockGetCurrencyById.mockResolvedValueOnce(bot.toPair.quoteCurrency);
      mockGetStreamQuotationByBaseAndQuoteAndGatewayName.mockResolvedValueOnce(
        streamQuotation,
      );
      mockGetCryptoMarketByBaseAndQuote.mockReturnValueOnce(toMarket);

      await sut.execute(bot);

      expect(mockGetByByIdBotOtc).toHaveBeenCalledTimes(1);
      expect(mockUpdateBotOtc).toHaveBeenCalledTimes(1);
      expect(mockGetAllByBotOtcAndStateIn).toHaveBeenCalledTimes(1);
      expect(mockCreateBotOtcOrder).toHaveBeenCalledTimes(1);
      expect(mockGetStreamPairById).toHaveBeenCalledTimes(2);
      expect(
        mockGetStreamQuotationByBaseAndQuoteAndGatewayName,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(4);
      expect(mockGetProviderName).toBeCalled();
      expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoRemittance).toHaveBeenCalledTimes(1);
    });
  });
});
