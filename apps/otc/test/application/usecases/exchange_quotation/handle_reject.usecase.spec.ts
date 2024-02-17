import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  ExchangeQuotationGateway,
  HandleRejectExchangeQuotationEventUseCase as UseCase,
  UtilService,
} from '@zro/otc/application';
import {
  ExchangeQuotationEntity,
  ExchangeQuotationRepository,
  ExchangeQuotationState,
} from '@zro/otc/domain';
import { FeatureSettingFactory } from '@zro/test/utils/config';
import {
  FeatureSettingEntity,
  FeatureSettingName,
  FeatureSettingState,
} from '@zro/utils/domain';
import { ExchangeQuotationFactory } from '@zro/test/otc/config';

describe('HandleRejectExchangeQuotationEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockRepository = () => {
    const exchangeQuotationRepository: ExchangeQuotationRepository =
      createMock<ExchangeQuotationRepository>();
    const mockUpdateExchangeQuotationRepository: jest.Mock = On(
      exchangeQuotationRepository,
    ).get(method((mock) => mock.update));
    const mockGetExchangeQuotationRepository: jest.Mock = On(
      exchangeQuotationRepository,
    ).get(method((mock) => mock.getAllByStateIn));

    return {
      exchangeQuotationRepository,
      mockUpdateExchangeQuotationRepository,
      mockGetExchangeQuotationRepository,
    };
  };

  const mockService = () => {
    const utilService: UtilService = createMock<UtilService>();
    const mockGetFeatureSettingByName: jest.Mock = On(utilService).get(
      method((mock) => mock.getFeatureSettingByName),
    );

    return {
      utilService,
      mockGetFeatureSettingByName,
    };
  };

  const mockGateway = () => {
    const pspGateway: ExchangeQuotationGateway =
      createMock<ExchangeQuotationGateway>();
    const mockRejectGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.rejectExchangeQuotation),
    );

    return {
      pspGateway,
      mockRejectGateway,
    };
  };

  const makeSut = () => {
    const {
      exchangeQuotationRepository,
      mockUpdateExchangeQuotationRepository,
      mockGetExchangeQuotationRepository,
    } = mockRepository();

    const { pspGateway, mockRejectGateway } = mockGateway();

    const { utilService, mockGetFeatureSettingByName } = mockService();

    const sut = new UseCase(
      logger,
      pspGateway,
      exchangeQuotationRepository,
      utilService,
    );

    return {
      sut,
      mockUpdateExchangeQuotationRepository,
      mockGetExchangeQuotationRepository,
      mockRejectGateway,
      mockGetFeatureSettingByName,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const {
        sut,
        mockUpdateExchangeQuotationRepository,
        mockGetExchangeQuotationRepository,
        mockRejectGateway,
        mockGetFeatureSettingByName,
      } = makeSut();

      await expect(sut.execute(null)).rejects.toThrow(MissingDataException);
      expect(mockUpdateExchangeQuotationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetExchangeQuotationRepository).toHaveBeenCalledTimes(0);
      expect(mockRejectGateway).toHaveBeenCalledTimes(0);
      expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should success but do nothing if feature is not deactive.', async () => {
      const {
        sut,
        mockUpdateExchangeQuotationRepository,
        mockGetExchangeQuotationRepository,
        mockRejectGateway,
        mockGetFeatureSettingByName,
      } = makeSut();

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
          {
            name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
            state: FeatureSettingState.DEACTIVE,
          },
        );

      mockGetFeatureSettingByName.mockResolvedValue(featureSetting);

      await sut.execute(FeatureSettingName.CREATE_EXCHANGE_QUOTATION);

      expect(mockUpdateExchangeQuotationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetExchangeQuotationRepository).toHaveBeenCalledTimes(1);
      expect(mockRejectGateway).toHaveBeenCalledTimes(0);
      expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should success rejected.', async () => {
      const {
        sut,
        mockUpdateExchangeQuotationRepository,
        mockGetExchangeQuotationRepository,
        mockRejectGateway,
        mockGetFeatureSettingByName,
      } = makeSut();

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
          {
            name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
            state: FeatureSettingState.DEACTIVE,
          },
        );

      const exchangeQuotation =
        await ExchangeQuotationFactory.create<ExchangeQuotationEntity>(
          ExchangeQuotationEntity.name,
          {
            state: ExchangeQuotationState.PENDING,
          },
        );

      mockGetFeatureSettingByName.mockResolvedValue(featureSetting);
      mockGetExchangeQuotationRepository.mockResolvedValue([exchangeQuotation]);

      await sut.execute(FeatureSettingName.CREATE_EXCHANGE_QUOTATION);

      expect(mockUpdateExchangeQuotationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetExchangeQuotationRepository).toHaveBeenCalledTimes(1);
      expect(mockRejectGateway).toHaveBeenCalledTimes(1);
      expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
    });
  });
});
