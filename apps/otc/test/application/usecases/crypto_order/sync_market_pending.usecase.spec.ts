import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  ConversionRepository,
  CryptoOrderEntity,
  CryptoOrderRepository,
  CryptoRemittanceRepository,
  CryptoRemittanceStatus,
  ProviderRepository,
  SystemEntity,
} from '@zro/otc/domain';
import { CurrencyEntity, CurrencyType } from '@zro/operations/domain';
import { StreamQuotationEntity } from '@zro/quotations/domain';
import {
  SyncMarketPendingCryptoOrdersUseCase as UseCase,
  CryptoRemittanceEventEmitter,
  CryptoOrderEventEmitter,
  QuotationService,
  CryptoRemittanceGateway,
  CryptoRemittanceGatewayNotFoundException,
  ProviderNotFoundException,
  CryptoMarketNotFoundException,
  CryptoRemittanceNotPlacedException,
  OfflineCryptoRemittanceGatewayException,
} from '@zro/otc/application';
import { CryptoOrderFactory } from '@zro/test/otc/config';
import { CurrencyFactory } from '@zro/test/operations/config';
import { StreamQuotationFactory } from '@zro/test/quotations/config';

const system = new SystemEntity({
  id: faker.datatype.uuid(),
  name: 'CONVERSION_SYSTEM',
});

describe('SyncMarketPendingCryptoOrdersUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const cryptoOrderEmitter: CryptoOrderEventEmitter =
      createMock<CryptoOrderEventEmitter>();
    const mockPendingCryptoOrderEmitter: jest.Mock = On(cryptoOrderEmitter).get(
      method((mock) => mock.pendingCryptoOrder),
    );
    const mockConfirmedCryptoOrderEmitter: jest.Mock = On(
      cryptoOrderEmitter,
    ).get(method((mock) => mock.confirmedCryptoOrder));

    const cryptoRemittanceEmitter: CryptoRemittanceEventEmitter =
      createMock<CryptoRemittanceEventEmitter>();
    const mockPendingCryptoRemittanceEmitter: jest.Mock = On(
      cryptoRemittanceEmitter,
    ).get(method((mock) => mock.pendingCryptoRemittance));
    const mockWaitingCryptoRemittanceEmitter: jest.Mock = On(
      cryptoRemittanceEmitter,
    ).get(method((mock) => mock.waitingCryptoRemittance));
    const mockCanceledCryptoRemittanceEmitter: jest.Mock = On(
      cryptoRemittanceEmitter,
    ).get(method((mock) => mock.canceledCryptoRemittance));
    const mockFilledCryptoRemittanceEmitter: jest.Mock = On(
      cryptoRemittanceEmitter,
    ).get(method((mock) => mock.filledCryptoRemittance));

    return {
      cryptoOrderEmitter,
      mockPendingCryptoOrderEmitter,
      mockConfirmedCryptoOrderEmitter,
      cryptoRemittanceEmitter,
      mockPendingCryptoRemittanceEmitter,
      mockWaitingCryptoRemittanceEmitter,
      mockCanceledCryptoRemittanceEmitter,
      mockFilledCryptoRemittanceEmitter,
    };
  };

  const mockRepository = () => {
    const cryptoRemittanceRepository: CryptoRemittanceRepository =
      createMock<CryptoRemittanceRepository>();
    const mockCreateCryptoRemittanceRepository: jest.Mock = On(
      cryptoRemittanceRepository,
    ).get(method((mock) => mock.create));

    const cryptoOrderRepository: CryptoOrderRepository =
      createMock<CryptoOrderRepository>();
    const mockGetAllCryptoOrderByBaseCurrencyRepository: jest.Mock = On(
      cryptoOrderRepository,
    ).get(
      method((mock) => mock.getAllWithConversionByBaseCurrencyAndStateAndType),
    );
    const mockCreateCryptoOrderRepository: jest.Mock = On(
      cryptoOrderRepository,
    ).get(method((mock) => mock.create));
    const mockUpdateCryptoOrderRepository: jest.Mock = On(
      cryptoOrderRepository,
    ).get(method((mock) => mock.update));

    const providerRepository: ProviderRepository =
      createMock<ProviderRepository>();
    const mockGetProviderByNameRepository: jest.Mock = On(
      providerRepository,
    ).get(method((mock) => mock.getByName));

    const conversionRepository: ConversionRepository =
      createMock<ConversionRepository>();
    const mockUpdateConversionRepository: jest.Mock = On(
      conversionRepository,
    ).get(method((mock) => mock.update));

    return {
      cryptoRemittanceRepository,
      cryptoOrderRepository,
      conversionRepository,
      providerRepository,
      mockUpdateConversionRepository,
      mockCreateCryptoRemittanceRepository,
      mockGetProviderByNameRepository,
      mockGetAllCryptoOrderByBaseCurrencyRepository,
      mockCreateCryptoOrderRepository,
      mockUpdateCryptoOrderRepository,
    };
  };

  const mockService = () => {
    const quotationService: QuotationService = createMock<QuotationService>();
    const mockGetStreamQuotationService: jest.Mock = On(quotationService).get(
      method((mock) => mock.getStreamQuotationByBaseCurrency),
    );

    return {
      quotationService,
      mockGetStreamQuotationService,
    };
  };

  const mockGateway = () => {
    const cryptoRemittanceGateway: CryptoRemittanceGateway =
      createMock<CryptoRemittanceGateway>();
    const mockGetProviderNameGateway: jest.Mock = On(
      cryptoRemittanceGateway,
    ).get(method((mock) => mock.getProviderName));
    const mockGetCryptoMarketByBaseAndQuoteGateway: jest.Mock = On(
      cryptoRemittanceGateway,
    ).get(method((mock) => mock.getCryptoMarketByBaseAndQuote));
    const mockCreateCryptoRemittanceGateway: jest.Mock = On(
      cryptoRemittanceGateway,
    ).get(method((mock) => mock.createCryptoRemittance));

    return {
      cryptoRemittanceGateway,
      mockGetProviderNameGateway,
      mockGetCryptoMarketByBaseAndQuoteGateway,
      mockCreateCryptoRemittanceGateway,
    };
  };

  const makeSut = () => {
    const {
      cryptoOrderEmitter,
      cryptoRemittanceEmitter,
      mockPendingCryptoOrderEmitter,
      mockConfirmedCryptoOrderEmitter,
      mockPendingCryptoRemittanceEmitter,
      mockWaitingCryptoRemittanceEmitter,
      mockCanceledCryptoRemittanceEmitter,
      mockFilledCryptoRemittanceEmitter,
    } = mockEmitter();

    const {
      cryptoRemittanceRepository,
      cryptoOrderRepository,
      conversionRepository,
      providerRepository,
      mockUpdateConversionRepository,
      mockCreateCryptoRemittanceRepository,
      mockGetProviderByNameRepository,
      mockGetAllCryptoOrderByBaseCurrencyRepository,
      mockCreateCryptoOrderRepository,
      mockUpdateCryptoOrderRepository,
    } = mockRepository();

    const { quotationService, mockGetStreamQuotationService } = mockService();

    const {
      cryptoRemittanceGateway,
      mockGetProviderNameGateway,
      mockGetCryptoMarketByBaseAndQuoteGateway,
      mockCreateCryptoRemittanceGateway,
    } = mockGateway();

    const sut = new UseCase(
      logger,
      cryptoRemittanceRepository,
      cryptoOrderRepository,
      providerRepository,
      conversionRepository,
      quotationService,
      [cryptoRemittanceGateway],
      cryptoRemittanceEmitter,
      cryptoOrderEmitter,
      [system],
    );
    return {
      sut,
      mockUpdateConversionRepository,
      mockCreateCryptoRemittanceRepository,
      mockGetProviderByNameRepository,
      mockGetAllCryptoOrderByBaseCurrencyRepository,
      mockCreateCryptoOrderRepository,
      mockUpdateCryptoOrderRepository,
      mockPendingCryptoOrderEmitter,
      mockConfirmedCryptoOrderEmitter,
      mockPendingCryptoRemittanceEmitter,
      mockWaitingCryptoRemittanceEmitter,
      mockCanceledCryptoRemittanceEmitter,
      mockFilledCryptoRemittanceEmitter,
      mockGetStreamQuotationService,
      mockGetProviderNameGateway,
      mockGetCryptoMarketByBaseAndQuoteGateway,
      mockCreateCryptoRemittanceGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not sync if missing params', async () => {
      const {
        sut,
        mockUpdateConversionRepository,
        mockCreateCryptoRemittanceRepository,
        mockGetProviderByNameRepository,
        mockGetAllCryptoOrderByBaseCurrencyRepository,
        mockCreateCryptoOrderRepository,
        mockUpdateCryptoOrderRepository,
        mockPendingCryptoOrderEmitter,
        mockConfirmedCryptoOrderEmitter,
        mockPendingCryptoRemittanceEmitter,
        mockWaitingCryptoRemittanceEmitter,
        mockCanceledCryptoRemittanceEmitter,
        mockFilledCryptoRemittanceEmitter,
        mockGetStreamQuotationService,
        mockGetProviderNameGateway,
        mockGetCryptoMarketByBaseAndQuoteGateway,
        mockCreateCryptoRemittanceGateway,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(mockGetProviderByNameRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllCryptoOrderByBaseCurrencyRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockConfirmedCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockWaitingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockCanceledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockFilledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetStreamQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetProviderNameGateway).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoMarketByBaseAndQuoteGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not sync when amount is zero', async () => {
      const {
        sut,
        mockUpdateConversionRepository,
        mockCreateCryptoRemittanceRepository,
        mockGetProviderByNameRepository,
        mockGetAllCryptoOrderByBaseCurrencyRepository,
        mockCreateCryptoOrderRepository,
        mockUpdateCryptoOrderRepository,
        mockPendingCryptoOrderEmitter,
        mockConfirmedCryptoOrderEmitter,
        mockPendingCryptoRemittanceEmitter,
        mockWaitingCryptoRemittanceEmitter,
        mockCanceledCryptoRemittanceEmitter,
        mockFilledCryptoRemittanceEmitter,
        mockGetStreamQuotationService,
        mockGetProviderNameGateway,
        mockGetCryptoMarketByBaseAndQuoteGateway,
        mockCreateCryptoRemittanceGateway,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
        { amount: 0, system },
      );
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          { composedBy: null },
        );

      mockGetAllCryptoOrderByBaseCurrencyRepository.mockResolvedValue([
        cryptoOrder,
      ]);
      mockGetStreamQuotationService.mockResolvedValue(streamQuotation);

      const result = await sut.execute(baseCurrency);

      expect(result).toBeUndefined();
      expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(mockGetProviderByNameRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllCryptoOrderByBaseCurrencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(1);
      expect(mockPendingCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockConfirmedCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockWaitingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockCanceledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockFilledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetStreamQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetProviderNameGateway).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoMarketByBaseAndQuoteGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not sync with different base currency', async () => {
      const {
        sut,
        mockUpdateConversionRepository,
        mockCreateCryptoRemittanceRepository,
        mockGetProviderByNameRepository,
        mockGetAllCryptoOrderByBaseCurrencyRepository,
        mockCreateCryptoOrderRepository,
        mockUpdateCryptoOrderRepository,
        mockPendingCryptoOrderEmitter,
        mockConfirmedCryptoOrderEmitter,
        mockPendingCryptoRemittanceEmitter,
        mockWaitingCryptoRemittanceEmitter,
        mockCanceledCryptoRemittanceEmitter,
        mockFilledCryptoRemittanceEmitter,
        mockGetStreamQuotationService,
        mockGetProviderNameGateway,
        mockGetCryptoMarketByBaseAndQuoteGateway,
        mockCreateCryptoRemittanceGateway,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
        { system },
      );
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          { composedBy: null },
        );

      mockGetAllCryptoOrderByBaseCurrencyRepository.mockResolvedValue([
        cryptoOrder,
      ]);
      mockGetStreamQuotationService.mockResolvedValue(streamQuotation);

      const result = await sut.execute(baseCurrency);

      expect(result).toBeUndefined();
      expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(mockGetProviderByNameRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllCryptoOrderByBaseCurrencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockConfirmedCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockWaitingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockCanceledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockFilledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetStreamQuotationService).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNameGateway).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoMarketByBaseAndQuoteGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not sync with fiat base currency', async () => {
      const {
        sut,
        mockUpdateConversionRepository,
        mockCreateCryptoRemittanceRepository,
        mockGetProviderByNameRepository,
        mockGetAllCryptoOrderByBaseCurrencyRepository,
        mockCreateCryptoOrderRepository,
        mockUpdateCryptoOrderRepository,
        mockPendingCryptoOrderEmitter,
        mockConfirmedCryptoOrderEmitter,
        mockPendingCryptoRemittanceEmitter,
        mockWaitingCryptoRemittanceEmitter,
        mockCanceledCryptoRemittanceEmitter,
        mockFilledCryptoRemittanceEmitter,
        mockGetStreamQuotationService,
        mockGetProviderNameGateway,
        mockGetCryptoMarketByBaseAndQuoteGateway,
        mockCreateCryptoRemittanceGateway,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { type: CurrencyType.FIAT },
      );
      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
        { system },
      );
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          { baseCurrency, composedBy: null },
        );

      mockGetAllCryptoOrderByBaseCurrencyRepository.mockResolvedValue([
        cryptoOrder,
      ]);
      mockGetStreamQuotationService.mockResolvedValue(streamQuotation);

      const result = await sut.execute(baseCurrency);

      expect(result).toBeUndefined();
      expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(mockGetProviderByNameRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllCryptoOrderByBaseCurrencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockConfirmedCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockWaitingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockCanceledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockFilledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetStreamQuotationService).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNameGateway).toHaveBeenCalledTimes(0);
      expect(mockGetCryptoMarketByBaseAndQuoteGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not sync without gateway', async () => {
      const {
        sut,
        mockUpdateConversionRepository,
        mockCreateCryptoRemittanceRepository,
        mockGetProviderByNameRepository,
        mockGetAllCryptoOrderByBaseCurrencyRepository,
        mockCreateCryptoOrderRepository,
        mockUpdateCryptoOrderRepository,
        mockPendingCryptoOrderEmitter,
        mockConfirmedCryptoOrderEmitter,
        mockPendingCryptoRemittanceEmitter,
        mockWaitingCryptoRemittanceEmitter,
        mockCanceledCryptoRemittanceEmitter,
        mockFilledCryptoRemittanceEmitter,
        mockGetStreamQuotationService,
        mockGetProviderNameGateway,
        mockGetCryptoMarketByBaseAndQuoteGateway,
        mockCreateCryptoRemittanceGateway,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { type: CurrencyType.CRYPTO },
      );
      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
        { system },
      );
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          { baseCurrency, composedBy: null },
        );

      mockGetAllCryptoOrderByBaseCurrencyRepository.mockResolvedValue([
        cryptoOrder,
      ]);
      mockGetStreamQuotationService.mockResolvedValue(streamQuotation);
      mockGetProviderNameGateway.mockResolvedValue(null);

      const testScript = () => sut.execute(streamQuotation.baseCurrency);

      await expect(testScript).rejects.toThrow(
        CryptoRemittanceGatewayNotFoundException,
      );
      expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(mockGetProviderByNameRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllCryptoOrderByBaseCurrencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockConfirmedCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockWaitingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockCanceledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockFilledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetStreamQuotationService).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNameGateway).toHaveBeenCalledTimes(1);
      expect(mockGetCryptoMarketByBaseAndQuoteGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not sync without provider', async () => {
      const {
        sut,
        mockUpdateConversionRepository,
        mockCreateCryptoRemittanceRepository,
        mockGetProviderByNameRepository,
        mockGetAllCryptoOrderByBaseCurrencyRepository,
        mockCreateCryptoOrderRepository,
        mockUpdateCryptoOrderRepository,
        mockPendingCryptoOrderEmitter,
        mockConfirmedCryptoOrderEmitter,
        mockPendingCryptoRemittanceEmitter,
        mockWaitingCryptoRemittanceEmitter,
        mockCanceledCryptoRemittanceEmitter,
        mockFilledCryptoRemittanceEmitter,
        mockGetStreamQuotationService,
        mockGetProviderNameGateway,
        mockGetCryptoMarketByBaseAndQuoteGateway,
        mockCreateCryptoRemittanceGateway,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { type: CurrencyType.CRYPTO },
      );
      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
        { system },
      );
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          { baseCurrency, composedBy: null },
        );

      mockGetAllCryptoOrderByBaseCurrencyRepository.mockResolvedValue([
        cryptoOrder,
      ]);
      mockGetStreamQuotationService.mockResolvedValue(streamQuotation);
      mockGetProviderNameGateway.mockReturnValue(streamQuotation.gatewayName);
      mockGetProviderByNameRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(streamQuotation.baseCurrency);

      await expect(testScript).rejects.toThrow(ProviderNotFoundException);
      expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(mockGetProviderByNameRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllCryptoOrderByBaseCurrencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockConfirmedCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockWaitingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockCanceledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockFilledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetStreamQuotationService).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNameGateway).toHaveBeenCalledTimes(2);
      expect(mockGetCryptoMarketByBaseAndQuoteGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not sync without markets', async () => {
      const {
        sut,
        mockUpdateConversionRepository,
        mockCreateCryptoRemittanceRepository,
        mockGetProviderByNameRepository,
        mockGetAllCryptoOrderByBaseCurrencyRepository,
        mockCreateCryptoOrderRepository,
        mockUpdateCryptoOrderRepository,
        mockPendingCryptoOrderEmitter,
        mockConfirmedCryptoOrderEmitter,
        mockPendingCryptoRemittanceEmitter,
        mockWaitingCryptoRemittanceEmitter,
        mockCanceledCryptoRemittanceEmitter,
        mockFilledCryptoRemittanceEmitter,
        mockGetStreamQuotationService,
        mockGetProviderNameGateway,
        mockGetCryptoMarketByBaseAndQuoteGateway,
        mockCreateCryptoRemittanceGateway,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { type: CurrencyType.CRYPTO },
      );
      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
        { system },
      );
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          { baseCurrency, composedBy: null },
        );

      mockGetAllCryptoOrderByBaseCurrencyRepository.mockResolvedValue([
        cryptoOrder,
      ]);
      mockGetStreamQuotationService.mockResolvedValue(streamQuotation);
      mockGetProviderNameGateway.mockReturnValue(streamQuotation.gatewayName);
      mockGetProviderByNameRepository.mockResolvedValue({});
      mockGetCryptoMarketByBaseAndQuoteGateway.mockResolvedValue(null);

      const testScript = () => sut.execute(streamQuotation.baseCurrency);

      await expect(testScript).rejects.toThrow(CryptoMarketNotFoundException);
      expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(mockGetProviderByNameRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllCryptoOrderByBaseCurrencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockConfirmedCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockWaitingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockCanceledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockFilledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetStreamQuotationService).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNameGateway).toHaveBeenCalledTimes(2);
      expect(mockGetCryptoMarketByBaseAndQuoteGateway).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should not sync when amount is not enough to market', async () => {
      const {
        sut,
        mockUpdateConversionRepository,
        mockCreateCryptoRemittanceRepository,
        mockGetProviderByNameRepository,
        mockGetAllCryptoOrderByBaseCurrencyRepository,
        mockCreateCryptoOrderRepository,
        mockUpdateCryptoOrderRepository,
        mockPendingCryptoOrderEmitter,
        mockConfirmedCryptoOrderEmitter,
        mockPendingCryptoRemittanceEmitter,
        mockWaitingCryptoRemittanceEmitter,
        mockCanceledCryptoRemittanceEmitter,
        mockFilledCryptoRemittanceEmitter,
        mockGetStreamQuotationService,
        mockGetProviderNameGateway,
        mockGetCryptoMarketByBaseAndQuoteGateway,
        mockCreateCryptoRemittanceGateway,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { type: CurrencyType.CRYPTO },
      );
      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
        { system },
      );
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          { baseCurrency, composedBy: null },
        );

      mockGetAllCryptoOrderByBaseCurrencyRepository.mockResolvedValue([
        cryptoOrder,
      ]);
      mockGetStreamQuotationService.mockResolvedValue(streamQuotation);
      mockGetProviderNameGateway.mockReturnValue(streamQuotation.gatewayName);
      mockGetProviderByNameRepository.mockResolvedValue({});
      mockGetCryptoMarketByBaseAndQuoteGateway.mockResolvedValue({
        minSize: cryptoOrder.amount + 1,
      });

      const testScript = await sut.execute(streamQuotation.baseCurrency);

      expect(testScript).toBeUndefined();
      expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(mockGetProviderByNameRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllCryptoOrderByBaseCurrencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockConfirmedCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockWaitingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockCanceledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockFilledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetStreamQuotationService).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNameGateway).toHaveBeenCalledTimes(2);
      expect(mockGetCryptoMarketByBaseAndQuoteGateway).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should not sync with offline create crypto gateway ERROR', async () => {
      const {
        sut,
        mockUpdateConversionRepository,
        mockCreateCryptoRemittanceRepository,
        mockGetProviderByNameRepository,
        mockGetAllCryptoOrderByBaseCurrencyRepository,
        mockCreateCryptoOrderRepository,
        mockUpdateCryptoOrderRepository,
        mockPendingCryptoOrderEmitter,
        mockConfirmedCryptoOrderEmitter,
        mockPendingCryptoRemittanceEmitter,
        mockWaitingCryptoRemittanceEmitter,
        mockCanceledCryptoRemittanceEmitter,
        mockFilledCryptoRemittanceEmitter,
        mockGetStreamQuotationService,
        mockGetProviderNameGateway,
        mockGetCryptoMarketByBaseAndQuoteGateway,
        mockCreateCryptoRemittanceGateway,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { type: CurrencyType.CRYPTO },
      );
      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
        { system },
      );
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          { baseCurrency, composedBy: null },
        );

      mockGetAllCryptoOrderByBaseCurrencyRepository.mockResolvedValue([
        cryptoOrder,
      ]);
      mockGetStreamQuotationService.mockResolvedValue(streamQuotation);
      mockGetProviderNameGateway.mockReturnValue(streamQuotation.gatewayName);
      mockGetProviderByNameRepository.mockResolvedValue({});
      mockGetCryptoMarketByBaseAndQuoteGateway.mockResolvedValue({});
      mockCreateCryptoRemittanceGateway.mockRejectedValueOnce(
        new OfflineCryptoRemittanceGatewayException(new Error()),
      );

      const testScript = () => sut.execute(streamQuotation.baseCurrency);

      await expect(testScript).rejects.toThrow(
        OfflineCryptoRemittanceGatewayException,
      );
      expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(mockGetProviderByNameRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllCryptoOrderByBaseCurrencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockConfirmedCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockWaitingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockCanceledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockFilledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetStreamQuotationService).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNameGateway).toHaveBeenCalledTimes(2);
      expect(mockGetCryptoMarketByBaseAndQuoteGateway).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(1);
    });

    it('TC0010 - Should not sync with ERROR remittance status', async () => {
      const {
        sut,
        mockUpdateConversionRepository,
        mockCreateCryptoRemittanceRepository,
        mockGetProviderByNameRepository,
        mockGetAllCryptoOrderByBaseCurrencyRepository,
        mockCreateCryptoOrderRepository,
        mockUpdateCryptoOrderRepository,
        mockPendingCryptoOrderEmitter,
        mockConfirmedCryptoOrderEmitter,
        mockPendingCryptoRemittanceEmitter,
        mockWaitingCryptoRemittanceEmitter,
        mockCanceledCryptoRemittanceEmitter,
        mockFilledCryptoRemittanceEmitter,
        mockGetStreamQuotationService,
        mockGetProviderNameGateway,
        mockGetCryptoMarketByBaseAndQuoteGateway,
        mockCreateCryptoRemittanceGateway,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { type: CurrencyType.CRYPTO },
      );
      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
        { system },
      );
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          { baseCurrency, composedBy: null },
        );

      mockGetAllCryptoOrderByBaseCurrencyRepository.mockResolvedValue([
        cryptoOrder,
      ]);
      mockGetStreamQuotationService.mockResolvedValue(streamQuotation);
      mockGetProviderNameGateway.mockReturnValue(streamQuotation.gatewayName);
      mockGetProviderByNameRepository.mockResolvedValue({});
      mockGetCryptoMarketByBaseAndQuoteGateway.mockResolvedValue({});
      mockCreateCryptoRemittanceGateway.mockResolvedValue({
        status: CryptoRemittanceStatus.ERROR,
      });

      const testScript = () => sut.execute(streamQuotation.baseCurrency);

      await expect(testScript).rejects.toThrow(
        CryptoRemittanceNotPlacedException,
      );
      expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(mockGetProviderByNameRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllCryptoOrderByBaseCurrencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockConfirmedCryptoOrderEmitter).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockWaitingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockCanceledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockFilledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetStreamQuotationService).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNameGateway).toHaveBeenCalledTimes(2);
      expect(mockGetCryptoMarketByBaseAndQuoteGateway).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0011 - Should sync with PENDING remittance status', async () => {
      const {
        sut,
        mockUpdateConversionRepository,
        mockCreateCryptoRemittanceRepository,
        mockGetProviderByNameRepository,
        mockGetAllCryptoOrderByBaseCurrencyRepository,
        mockCreateCryptoOrderRepository,
        mockUpdateCryptoOrderRepository,
        mockPendingCryptoOrderEmitter,
        mockConfirmedCryptoOrderEmitter,
        mockPendingCryptoRemittanceEmitter,
        mockWaitingCryptoRemittanceEmitter,
        mockCanceledCryptoRemittanceEmitter,
        mockFilledCryptoRemittanceEmitter,
        mockGetStreamQuotationService,
        mockGetProviderNameGateway,
        mockGetCryptoMarketByBaseAndQuoteGateway,
        mockCreateCryptoRemittanceGateway,
      } = makeSut();

      const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { type: CurrencyType.CRYPTO },
      );
      const cryptoOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
        CryptoOrderEntity.name,
        { system },
      );
      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
          { baseCurrency, quoteCurrency: baseCurrency, composedBy: null },
        );

      mockGetAllCryptoOrderByBaseCurrencyRepository.mockResolvedValue([
        cryptoOrder,
      ]);
      mockGetStreamQuotationService.mockResolvedValue(streamQuotation);
      mockGetProviderNameGateway.mockReturnValue(streamQuotation.gatewayName);
      mockGetProviderByNameRepository.mockResolvedValue({});
      mockGetCryptoMarketByBaseAndQuoteGateway.mockResolvedValue({});
      mockCreateCryptoRemittanceGateway.mockResolvedValue({
        status: CryptoRemittanceStatus.PENDING,
        executedQuantity: cryptoOrder.amount,
      });

      const result = await sut.execute(streamQuotation.baseCurrency);

      expect(result).toBeUndefined();
      expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockGetProviderByNameRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllCryptoOrderByBaseCurrencyRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(1);
      expect(mockPendingCryptoOrderEmitter).toHaveBeenCalledTimes(1);
      expect(mockConfirmedCryptoOrderEmitter).toHaveBeenCalledTimes(1);
      expect(mockPendingCryptoRemittanceEmitter).toHaveBeenCalledTimes(1);
      expect(mockWaitingCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockCanceledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockFilledCryptoRemittanceEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetStreamQuotationService).toHaveBeenCalledTimes(1);
      expect(mockGetProviderNameGateway).toHaveBeenCalledTimes(2);
      expect(mockGetCryptoMarketByBaseAndQuoteGateway).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(1);
    });
  });
});
