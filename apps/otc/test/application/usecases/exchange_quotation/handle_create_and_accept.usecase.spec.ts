import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  ExchangeQuotationGateway,
  HandleCreateAndAcceptExchangeQuotationEventUseCase as UseCase,
  OperationService,
  RemittanceNotFoundException,
  UtilService,
  QuotationService,
  ExchangeQuotationInvalidStateException,
  ExchangeQuotationPspException,
  RemittanceInvalidStatusException,
} from '@zro/otc/application';
import {
  ExchangeQuotationEntity,
  ExchangeQuotationRepository,
  ExchangeQuotationServerRepository,
  ExchangeQuotationState,
  RemittanceEntity,
  RemittanceExchangeQuotationEntity,
  RemittanceExchangeQuotationRepository,
  RemittanceRepository,
  RemittanceStatus,
} from '@zro/otc/domain';
import {
  ExchangeQuotationFactory,
  RemittanceExchangeQuotationFactory,
  RemittanceFactory,
} from '@zro/test/otc/config';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CurrencyEntity } from '@zro/operations/domain';
import { CurrencyNotFoundException } from '@zro/operations/application';
import {
  FeatureSettingEntity,
  FeatureSettingName,
  FeatureSettingState,
} from '@zro/utils/domain';
import { FeatureSettingFactory } from '@zro/test/utils/config';
import { StreamQuotationNotFoundException } from '@zro/quotations/application';
import { StreamQuotationFactory } from '@zro/test/quotations/config';
import { StreamQuotationEntity } from '@zro/quotations/domain';

describe('HandleCreateAndAcceptExchangeQuotationEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const zroBankPartnerId = 990011;
  const operationCurrencyUsd = 'USD';

  const mockRepository = () => {
    const exchangeQuotationRepository: ExchangeQuotationRepository =
      createMock<ExchangeQuotationRepository>();
    const mockCreateExchangeQuotationRepository: jest.Mock = On(
      exchangeQuotationRepository,
    ).get(method((mock) => mock.create));

    const remittanceRepository: RemittanceRepository =
      createMock<RemittanceRepository>();
    const mockGetRemittanceRepository: jest.Mock = On(remittanceRepository).get(
      method((mock) => mock.getById),
    );

    const exchangeQuotationServerRepository: ExchangeQuotationServerRepository =
      createMock<ExchangeQuotationServerRepository>();
    const mockCreateExchangeQuotationServerRepository: jest.Mock = On(
      exchangeQuotationServerRepository,
    ).get(method((mock) => mock.createOrUpdate));

    const remittanceExchangeQuotationRepository: RemittanceExchangeQuotationRepository =
      createMock<RemittanceExchangeQuotationRepository>();
    const mockGetRemittanceExchangeQuotationRepository: jest.Mock = On(
      remittanceExchangeQuotationRepository,
    ).get(method((mock) => mock.getAllByRemittance));
    const mockCreateRemittanceExchangeQuotationRepository: jest.Mock = On(
      remittanceExchangeQuotationRepository,
    ).get(method((mock) => mock.create));

    return {
      exchangeQuotationRepository,
      remittanceRepository,
      exchangeQuotationServerRepository,
      remittanceExchangeQuotationRepository,
      mockCreateExchangeQuotationRepository,
      mockGetRemittanceRepository,
      mockCreateExchangeQuotationServerRepository,
      mockGetRemittanceExchangeQuotationRepository,
      mockCreateRemittanceExchangeQuotationRepository,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetCurrencyByTag: jest.Mock = On(operationService).get(
      method((mock) => mock.getCurrencyByTag),
    );

    const utilService: UtilService = createMock<UtilService>();
    const mockGetFeatureSettingByName: jest.Mock = On(utilService).get(
      method((mock) => mock.getFeatureSettingByName),
    );

    const quotationService: QuotationService = createMock<QuotationService>();
    const mockGetStreamQuotation: jest.Mock = On(quotationService).get(
      method((mock) => mock.getStreamQuotationByBaseCurrency),
    );

    return {
      operationService,
      utilService,
      quotationService,
      mockGetCurrencyByTag,
      mockGetFeatureSettingByName,
      mockGetStreamQuotation,
    };
  };

  const mockGateway = () => {
    const pspGateway: ExchangeQuotationGateway =
      createMock<ExchangeQuotationGateway>();
    const mockCreateGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.createExchangeQuotation),
    );
    const mockAcceptGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.acceptExchangeQuotation),
    );

    return {
      pspGateway,
      mockCreateGateway,
      mockAcceptGateway,
    };
  };

  const makeSut = () => {
    const {
      exchangeQuotationRepository,
      remittanceRepository,
      exchangeQuotationServerRepository,
      remittanceExchangeQuotationRepository,
      mockCreateExchangeQuotationRepository,
      mockGetRemittanceRepository,
      mockCreateExchangeQuotationServerRepository,
      mockCreateRemittanceExchangeQuotationRepository,
      mockGetRemittanceExchangeQuotationRepository,
    } = mockRepository();

    const {
      operationService,
      utilService,
      quotationService,
      mockGetCurrencyByTag,
      mockGetFeatureSettingByName,
      mockGetStreamQuotation,
    } = mockService();

    const { pspGateway, mockCreateGateway, mockAcceptGateway } = mockGateway();

    const sut = new UseCase(
      logger,
      pspGateway,
      exchangeQuotationRepository,
      exchangeQuotationServerRepository,
      remittanceRepository,
      remittanceExchangeQuotationRepository,
      operationService,
      utilService,
      quotationService,
      zroBankPartnerId,
      operationCurrencyUsd,
    );

    return {
      sut,
      mockCreateExchangeQuotationRepository,
      mockGetRemittanceRepository,
      mockCreateExchangeQuotationServerRepository,
      mockCreateGateway,
      mockAcceptGateway,
      mockGetCurrencyByTag,
      mockGetFeatureSettingByName,
      mockGetStreamQuotation,
      mockCreateRemittanceExchangeQuotationRepository,
      mockGetRemittanceExchangeQuotationRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const {
        sut,
        mockCreateExchangeQuotationRepository,
        mockGetRemittanceRepository,
        mockCreateExchangeQuotationServerRepository,
        mockCreateGateway,
        mockAcceptGateway,
        mockGetCurrencyByTag,
        mockGetFeatureSettingByName,
        mockGetStreamQuotation,
        mockCreateRemittanceExchangeQuotationRepository,
        mockGetRemittanceExchangeQuotationRepository,
      } = makeSut();

      const tests = [
        () => sut.execute(null, null, null, null),
        () => sut.execute([], null, null, null),
        () =>
          sut.execute(
            ['743c9ce8-f346-4e16-802c-17f12893c080'],
            null,
            null,
            null,
          ),
        () => sut.execute([], new Date(), null, null),
        () => sut.execute([], null, new Date(), null),
        () => sut.execute([], null, null, 'USD'),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
        expect(mockCreateExchangeQuotationRepository).toHaveBeenCalledTimes(0);
        expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(
          mockCreateExchangeQuotationServerRepository,
        ).toHaveBeenCalledTimes(0);
        expect(mockCreateGateway).toHaveBeenCalledTimes(0);
        expect(mockAcceptGateway).toHaveBeenCalledTimes(0);
        expect(mockGetCurrencyByTag).toHaveBeenCalledTimes(0);
        expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(0);
        expect(mockGetStreamQuotation).toHaveBeenCalledTimes(0);
        expect(
          mockCreateRemittanceExchangeQuotationRepository,
        ).toHaveBeenCalledTimes(0);
        expect(
          mockGetRemittanceExchangeQuotationRepository,
        ).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should invalid state if exchange quotation exists in pending or accepted state.', async () => {
      const {
        sut,
        mockCreateExchangeQuotationRepository,
        mockGetRemittanceRepository,
        mockCreateExchangeQuotationServerRepository,
        mockCreateGateway,
        mockAcceptGateway,
        mockGetCurrencyByTag,
        mockGetFeatureSettingByName,
        mockGetStreamQuotation,
        mockCreateRemittanceExchangeQuotationRepository,
        mockGetRemittanceExchangeQuotationRepository,
      } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { status: RemittanceStatus.WAITING },
      );

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
          {
            name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
            state: FeatureSettingState.ACTIVE,
          },
        );

      const exchangeQuotation =
        await ExchangeQuotationFactory.create<ExchangeQuotationEntity>(
          ExchangeQuotationEntity.name,
          { state: ExchangeQuotationState.PENDING },
        );

      const remittanceExchangeQuotation =
        await RemittanceExchangeQuotationFactory.create<RemittanceExchangeQuotationEntity>(
          RemittanceExchangeQuotationEntity.name,
          { exchangeQuotation, remittance },
        );

      mockGetFeatureSettingByName.mockResolvedValue(featureSetting);
      mockGetRemittanceExchangeQuotationRepository.mockResolvedValue([
        remittanceExchangeQuotation,
      ]);
      mockGetRemittanceRepository.mockResolvedValue(remittance);

      const test = () =>
        sut.execute([remittance.id], new Date(), new Date(), 'USD');

      await expect(test).rejects.toThrow(
        ExchangeQuotationInvalidStateException,
      );
      expect(mockCreateExchangeQuotationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateExchangeQuotationServerRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
      expect(mockAcceptGateway).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyByTag).toHaveBeenCalledTimes(0);
      expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(0);
      expect(
        mockCreateRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockGetRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should throw error if remittance is not found.', async () => {
      const {
        sut,
        mockCreateExchangeQuotationRepository,
        mockGetRemittanceRepository,
        mockCreateExchangeQuotationServerRepository,
        mockCreateGateway,
        mockAcceptGateway,
        mockGetCurrencyByTag,
        mockGetFeatureSettingByName,
        mockGetStreamQuotation,
        mockCreateRemittanceExchangeQuotationRepository,
        mockGetRemittanceExchangeQuotationRepository,
      } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { status: RemittanceStatus.WAITING },
      );

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
          {
            name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
            state: FeatureSettingState.ACTIVE,
          },
        );

      mockGetRemittanceRepository.mockResolvedValue(undefined);
      mockGetFeatureSettingByName.mockResolvedValue(featureSetting);

      const test = () =>
        sut.execute([remittance.id], new Date(), new Date(), 'USD');

      await expect(test).rejects.toThrow(RemittanceNotFoundException);
      expect(mockCreateExchangeQuotationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateExchangeQuotationServerRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
      expect(mockAcceptGateway).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyByTag).toHaveBeenCalledTimes(0);
      expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(0);
      expect(
        mockCreateRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockGetRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw error if remittance exists but missing some fields.', async () => {
      const {
        sut,
        mockCreateExchangeQuotationRepository,
        mockGetRemittanceRepository,
        mockCreateExchangeQuotationServerRepository,
        mockCreateGateway,
        mockAcceptGateway,
        mockGetCurrencyByTag,
        mockGetFeatureSettingByName,
        mockGetStreamQuotation,
        mockCreateRemittanceExchangeQuotationRepository,
        mockGetRemittanceExchangeQuotationRepository,
      } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { side: null, status: RemittanceStatus.WAITING },
      );

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
          {
            name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
            state: FeatureSettingState.ACTIVE,
          },
        );

      mockGetRemittanceRepository.mockResolvedValue(remittance);
      mockGetFeatureSettingByName.mockResolvedValue(featureSetting);

      const test = () =>
        sut.execute([remittance.id], new Date(), new Date(), 'USD');

      await expect(test).rejects.toThrow(MissingDataException);
      expect(mockCreateExchangeQuotationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateExchangeQuotationServerRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
      expect(mockAcceptGateway).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyByTag).toHaveBeenCalledTimes(0);
      expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(0);
      expect(
        mockCreateRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockGetRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw error if currency is not found.', async () => {
      const {
        sut,
        mockCreateExchangeQuotationRepository,
        mockGetRemittanceRepository,
        mockCreateExchangeQuotationServerRepository,
        mockCreateGateway,
        mockAcceptGateway,
        mockGetCurrencyByTag,
        mockGetFeatureSettingByName,
        mockGetStreamQuotation,
        mockCreateRemittanceExchangeQuotationRepository,
        mockGetRemittanceExchangeQuotationRepository,
      } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { status: RemittanceStatus.WAITING },
      );

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
          {
            name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
            state: FeatureSettingState.ACTIVE,
          },
        );

      mockGetRemittanceRepository.mockResolvedValue(remittance);
      mockGetCurrencyByTag.mockResolvedValue(undefined);
      mockGetFeatureSettingByName.mockResolvedValue(featureSetting);
      mockGetRemittanceExchangeQuotationRepository.mockResolvedValue([]);

      const test = () =>
        sut.execute([remittance.id], new Date(), new Date(), 'USD');

      await expect(test).rejects.toThrow(CurrencyNotFoundException);
      expect(mockCreateExchangeQuotationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateExchangeQuotationServerRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
      expect(mockAcceptGateway).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyByTag).toHaveBeenCalledTimes(1);
      expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(0);
      expect(
        mockCreateRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockGetRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should throw error if stream quotation is not found.', async () => {
      const {
        sut,
        mockCreateExchangeQuotationRepository,
        mockGetRemittanceRepository,
        mockCreateExchangeQuotationServerRepository,
        mockCreateGateway,
        mockAcceptGateway,
        mockGetCurrencyByTag,
        mockGetFeatureSettingByName,
        mockGetStreamQuotation,
        mockCreateRemittanceExchangeQuotationRepository,
        mockGetRemittanceExchangeQuotationRepository,
      } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { status: RemittanceStatus.WAITING },
      );

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
          {
            name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
            state: FeatureSettingState.ACTIVE,
          },
        );

      mockGetRemittanceRepository.mockResolvedValue(remittance);
      mockGetCurrencyByTag.mockResolvedValue(currency);
      mockGetFeatureSettingByName.mockResolvedValue(featureSetting);
      mockGetStreamQuotation.mockResolvedValue(undefined);
      mockGetRemittanceExchangeQuotationRepository.mockResolvedValue([]);

      const test = () =>
        sut.execute([remittance.id], new Date(), new Date(), 'USD');

      await expect(test).rejects.toThrow(StreamQuotationNotFoundException);
      expect(mockCreateExchangeQuotationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateExchangeQuotationServerRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
      expect(mockAcceptGateway).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyByTag).toHaveBeenCalledTimes(1);
      expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(
        mockCreateRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockGetRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0007 - Should not create/accept if the setting state is deactivated.', async () => {
      const {
        sut,
        mockCreateExchangeQuotationRepository,
        mockGetRemittanceRepository,
        mockCreateExchangeQuotationServerRepository,
        mockCreateGateway,
        mockAcceptGateway,
        mockGetCurrencyByTag,
        mockGetFeatureSettingByName,
        mockGetStreamQuotation,
        mockCreateRemittanceExchangeQuotationRepository,
        mockGetRemittanceExchangeQuotationRepository,
      } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { status: RemittanceStatus.WAITING },
      );

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
          {
            name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
            state: FeatureSettingState.DEACTIVE,
          },
        );

      mockGetFeatureSettingByName.mockResolvedValue(featureSetting);

      const test = await sut.execute(
        [remittance.id],
        new Date(),
        new Date(),
        'USD',
      );

      await expect(test).toBeUndefined();
      expect(mockCreateExchangeQuotationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateExchangeQuotationServerRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
      expect(mockAcceptGateway).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyByTag).toHaveBeenCalledTimes(0);
      expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(0);
      expect(
        mockCreateRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockGetRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should throw ExchangeQuotationPspException if exchange quotation has not been created.', async () => {
      const {
        sut,
        mockCreateExchangeQuotationRepository,
        mockGetRemittanceRepository,
        mockCreateExchangeQuotationServerRepository,
        mockCreateGateway,
        mockAcceptGateway,
        mockGetCurrencyByTag,
        mockGetFeatureSettingByName,
        mockGetStreamQuotation,
        mockCreateRemittanceExchangeQuotationRepository,
        mockGetRemittanceExchangeQuotationRepository,
      } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { status: RemittanceStatus.WAITING },
      );

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
          {
            name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
            state: FeatureSettingState.ACTIVE,
          },
        );

      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
        );

      mockGetRemittanceRepository.mockResolvedValue(remittance);
      mockGetCurrencyByTag.mockResolvedValue(currency);
      mockCreateGateway.mockResolvedValue(null);
      mockGetFeatureSettingByName.mockResolvedValue(featureSetting);
      mockGetStreamQuotation.mockResolvedValue(streamQuotation);
      mockGetRemittanceExchangeQuotationRepository.mockResolvedValue([]);

      const test = () =>
        sut.execute([remittance.id], new Date(), new Date(), 'USD');

      await expect(test).rejects.toThrow(ExchangeQuotationPspException);
      expect(mockCreateExchangeQuotationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateExchangeQuotationServerRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateGateway).toHaveBeenCalledTimes(1);
      expect(mockAcceptGateway).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyByTag).toHaveBeenCalledTimes(1);
      expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(
        mockCreateRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockGetRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0009 - Should throw ExchangeQuotationPspException if exchange quotation has not been accepted.', async () => {
      const {
        sut,
        mockCreateExchangeQuotationRepository,
        mockGetRemittanceRepository,
        mockCreateExchangeQuotationServerRepository,
        mockCreateGateway,
        mockAcceptGateway,
        mockGetCurrencyByTag,
        mockGetFeatureSettingByName,
        mockGetStreamQuotation,
        mockCreateRemittanceExchangeQuotationRepository,
        mockGetRemittanceExchangeQuotationRepository,
      } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { status: RemittanceStatus.WAITING },
      );

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
          {
            name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
            state: FeatureSettingState.ACTIVE,
          },
        );

      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
        );
      const exchangeQuotation =
        await ExchangeQuotationFactory.create<ExchangeQuotationEntity>(
          ExchangeQuotationEntity.name,
        );

      mockGetRemittanceRepository.mockResolvedValue(remittance);
      mockGetCurrencyByTag.mockResolvedValue(currency);
      mockCreateGateway.mockResolvedValue(exchangeQuotation);
      mockAcceptGateway.mockResolvedValue(null);
      mockGetFeatureSettingByName.mockResolvedValue(featureSetting);
      mockGetStreamQuotation.mockResolvedValue(streamQuotation);
      mockGetRemittanceExchangeQuotationRepository.mockResolvedValue([]);

      const test = () =>
        sut.execute([remittance.id], new Date(), new Date(), 'USD');

      await expect(test).rejects.toThrow(ExchangeQuotationPspException);
      expect(mockCreateExchangeQuotationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateExchangeQuotationServerRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateGateway).toHaveBeenCalledTimes(1);
      expect(mockAcceptGateway).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyByTag).toHaveBeenCalledTimes(1);
      expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(
        mockCreateRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockGetRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should throw RemittanceInvalidStatusException if remittance status is not waiting.', async () => {
      const {
        sut,
        mockCreateExchangeQuotationRepository,
        mockGetRemittanceRepository,
        mockCreateExchangeQuotationServerRepository,
        mockCreateGateway,
        mockAcceptGateway,
        mockGetCurrencyByTag,
        mockGetFeatureSettingByName,
        mockGetStreamQuotation,
        mockCreateRemittanceExchangeQuotationRepository,
        mockGetRemittanceExchangeQuotationRepository,
      } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { side: null, status: RemittanceStatus.OPEN },
      );

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
          {
            name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
            state: FeatureSettingState.ACTIVE,
          },
        );

      mockGetFeatureSettingByName.mockResolvedValue(featureSetting);
      mockGetRemittanceRepository.mockResolvedValue(remittance);

      const test = () =>
        sut.execute([remittance.id], new Date(), new Date(), 'USD');

      await expect(test).rejects.toThrow(RemittanceInvalidStatusException);
      expect(mockCreateExchangeQuotationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateExchangeQuotationServerRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
      expect(mockAcceptGateway).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyByTag).toHaveBeenCalledTimes(0);
      expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(0);
      expect(
        mockCreateRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(0);
      expect(
        mockGetRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0011 - Should create and accept exchange quotation with success.', async () => {
      const {
        sut,
        mockCreateExchangeQuotationRepository,
        mockGetRemittanceRepository,
        mockCreateExchangeQuotationServerRepository,
        mockCreateGateway,
        mockAcceptGateway,
        mockGetCurrencyByTag,
        mockGetFeatureSettingByName,
        mockGetStreamQuotation,
        mockCreateRemittanceExchangeQuotationRepository,
        mockGetRemittanceExchangeQuotationRepository,
      } = makeSut();

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
        { status: RemittanceStatus.WAITING },
      );

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const exchangeQuotation =
        await ExchangeQuotationFactory.create<ExchangeQuotationEntity>(
          ExchangeQuotationEntity.name,
        );

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
          {
            name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
            state: FeatureSettingState.ACTIVE,
          },
        );

      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
        );

      mockGetRemittanceRepository.mockResolvedValue(remittance);
      mockGetCurrencyByTag.mockResolvedValue(currency);
      mockCreateGateway.mockResolvedValue(exchangeQuotation);
      mockAcceptGateway.mockResolvedValue({ isAccepted: true });
      mockGetFeatureSettingByName.mockResolvedValue(featureSetting);
      mockGetStreamQuotation.mockResolvedValue(streamQuotation);
      mockGetRemittanceExchangeQuotationRepository.mockResolvedValue([]);

      const result = await sut.execute(
        [remittance.id],
        new Date(),
        new Date(),
        'USD',
      );

      expect(result).toBeDefined();
      expect(result.state).toBe(ExchangeQuotationState.ACCEPTED);
      expect(mockCreateExchangeQuotationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateExchangeQuotationServerRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreateGateway).toHaveBeenCalledTimes(1);
      expect(mockAcceptGateway).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyByTag).toHaveBeenCalledTimes(1);
      expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
      expect(
        mockCreateRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
