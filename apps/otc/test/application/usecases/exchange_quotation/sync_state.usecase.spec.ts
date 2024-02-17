import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  ExchangeQuotationGateway,
  SyncStateExchangeQuotationUseCase as UseCase,
  OperationService,
  UtilService,
  QuotationService,
  ExchangeQuotationEventEmitter,
  RemittanceEventEmitter,
  ExchangeQuotationNotFoundPspException,
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
} from '@zro/otc/domain';
import {
  ExchangeQuotationFactory,
  RemittanceExchangeQuotationFactory,
  RemittanceFactory,
} from '@zro/test/otc/config';
import * as MockTestGetExchange from '@zro/test/otc/mocks/get_exchange_quotation_by_id.mock';

describe('HandleCreateExchangeQuotationEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const exchangeQuotationRepository: ExchangeQuotationRepository =
      createMock<ExchangeQuotationRepository>();

    const mockUpdateExchangeQuotationRepository: jest.Mock = On(
      exchangeQuotationRepository,
    ).get(method((mock) => mock.update));
    const mockGetExchangeQuotationRepository: jest.Mock = On(
      exchangeQuotationRepository,
    ).get(method((mock) => mock.getAllByStateIn));

    const remittanceRepository: RemittanceRepository =
      createMock<RemittanceRepository>();
    const mockGetRemittanceRepository: jest.Mock = On(remittanceRepository).get(
      method((mock) => mock.getById),
    );
    const mockUpdateRemittanceRepository: jest.Mock = On(
      remittanceRepository,
    ).get(method((mock) => mock.update));

    const remittanceEventEmitter: RemittanceEventEmitter =
      createMock<RemittanceEventEmitter>();

    const mockClosedRemittanceRemittanceEventEmitter: jest.Mock = On(
      remittanceEventEmitter,
    ).get(method((mock) => mock.closedRemittance));

    const exchangeQuotationServerRepository: ExchangeQuotationServerRepository =
      createMock<ExchangeQuotationServerRepository>();
    const mockCreateExchangeQuotationServerRepository: jest.Mock = On(
      exchangeQuotationServerRepository,
    ).get(method((mock) => mock.createOrUpdate));

    const remittanceExchangeQuotationRepository: RemittanceExchangeQuotationRepository =
      createMock<RemittanceExchangeQuotationRepository>();
    const mockGetRemittanceExchangeQuotationRepository: jest.Mock = On(
      remittanceExchangeQuotationRepository,
    ).get(method((mock) => mock.getAllByExchangeQuotation));
    const mockCreateRemittanceExchangeQuotationRepository: jest.Mock = On(
      remittanceExchangeQuotationRepository,
    ).get(method((mock) => mock.create));

    return {
      mockGetExchangeQuotationRepository,
      exchangeQuotationRepository,
      remittanceRepository,
      exchangeQuotationServerRepository,
      remittanceExchangeQuotationRepository,
      mockUpdateExchangeQuotationRepository,
      mockGetRemittanceRepository,
      mockCreateExchangeQuotationServerRepository,
      mockGetRemittanceExchangeQuotationRepository,
      mockCreateRemittanceExchangeQuotationRepository,
      mockUpdateRemittanceRepository,
      remittanceEventEmitter,
      mockClosedRemittanceRemittanceEventEmitter,
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
    const mockGetGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.getExchangeQuotationById),
    );

    return {
      pspGateway,
      mockGetGateway,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: ExchangeQuotationEventEmitter =
      createMock<ExchangeQuotationEventEmitter>();
    const mockEmitEventApproved: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.approvedExchangeQuotation),
    );
    const mockEmitEventCompleted: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.completedExchangeQuotation),
    );

    const mockEmitEventCanceled: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.canceledExchangeQuotation),
    );

    return {
      eventEmitter,
      mockEmitEventApproved,
      mockEmitEventCompleted,
      mockEmitEventCanceled,
    };
  };

  const makeSut = () => {
    const {
      mockGetExchangeQuotationRepository,
      exchangeQuotationRepository,
      remittanceRepository,
      remittanceEventEmitter,
      remittanceExchangeQuotationRepository,
      mockUpdateExchangeQuotationRepository,
      mockGetRemittanceRepository,
      mockCreateExchangeQuotationServerRepository,
      mockCreateRemittanceExchangeQuotationRepository,
      mockGetRemittanceExchangeQuotationRepository,
      mockUpdateRemittanceRepository,
      mockClosedRemittanceRemittanceEventEmitter,
    } = mockRepository();

    const {
      mockGetCurrencyByTag,
      mockGetFeatureSettingByName,
      mockGetStreamQuotation,
    } = mockService();

    const { pspGateway, mockGetGateway } = mockGateway();

    const {
      eventEmitter,
      mockEmitEventApproved,
      mockEmitEventCanceled,
      mockEmitEventCompleted,
    } = mockEmitter();

    const sut = new UseCase(
      logger,
      pspGateway,
      exchangeQuotationRepository,
      remittanceRepository,
      remittanceExchangeQuotationRepository,
      remittanceEventEmitter,
      eventEmitter,
    );

    return {
      sut,
      mockUpdateExchangeQuotationRepository,
      mockGetRemittanceRepository,
      mockCreateExchangeQuotationServerRepository,
      mockGetGateway,
      mockGetCurrencyByTag,
      mockGetFeatureSettingByName,
      mockGetStreamQuotation,
      mockCreateRemittanceExchangeQuotationRepository,
      mockGetRemittanceExchangeQuotationRepository,
      mockGetExchangeQuotationRepository,
      mockEmitEventApproved,
      mockEmitEventCanceled,
      mockEmitEventCompleted,
      mockUpdateRemittanceRepository,
      mockClosedRemittanceRemittanceEventEmitter,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should success if exchangeQuotations return status APPROVED.', async () => {
      const {
        sut,
        mockGetExchangeQuotationRepository,
        mockGetGateway,
        mockEmitEventApproved,
      } = makeSut();

      const exchangeQuotationApproved =
        await ExchangeQuotationFactory.create<ExchangeQuotationEntity>(
          ExchangeQuotationEntity.name,
          {
            state: ExchangeQuotationState.APPROVED,
          },
        );

      mockGetGateway.mockImplementation(MockTestGetExchange.successApproved);

      mockGetExchangeQuotationRepository.mockResolvedValue([
        exchangeQuotationApproved,
      ]);

      await sut.execute();
      expect(mockGetExchangeQuotationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetGateway).toHaveBeenCalledTimes(1);
      expect(mockEmitEventApproved).toHaveBeenCalledTimes(1);
    });
    it('TC0002 - Should success if exchangeQuotations return status COMPLETED.', async () => {
      const {
        sut,
        mockGetExchangeQuotationRepository,
        mockGetGateway,
        mockEmitEventCompleted,
        mockGetRemittanceExchangeQuotationRepository,
        mockGetRemittanceRepository,
        mockUpdateRemittanceRepository,
        mockClosedRemittanceRemittanceEventEmitter,
      } = makeSut();

      const exchangeQuotationCompleted =
        await ExchangeQuotationFactory.create<ExchangeQuotationEntity>(
          ExchangeQuotationEntity.name,
          {
            state: ExchangeQuotationState.COMPLETED,
          },
        );

      mockGetGateway.mockImplementation(MockTestGetExchange.successCompleted);

      mockGetExchangeQuotationRepository.mockResolvedValue([
        exchangeQuotationCompleted,
      ]);

      const exchangeQuotation =
        await ExchangeQuotationFactory.create<ExchangeQuotationEntity>(
          ExchangeQuotationEntity.name,
          { state: ExchangeQuotationState.PENDING },
        );

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
      );

      const remittanceExchangeQuotation =
        await RemittanceExchangeQuotationFactory.create<RemittanceExchangeQuotationEntity>(
          RemittanceExchangeQuotationEntity.name,
          { exchangeQuotation, remittance },
        );

      mockGetRemittanceExchangeQuotationRepository.mockResolvedValue([
        remittanceExchangeQuotation,
      ]);

      await sut.execute();
      expect(mockGetExchangeQuotationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetGateway).toHaveBeenCalledTimes(1);
      expect(mockEmitEventCompleted).toHaveBeenCalledTimes(1);
      expect(
        mockGetRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockClosedRemittanceRemittanceEventEmitter).toHaveBeenCalledTimes(
        1,
      );
    });

    it('TC0003 - Should success if exchangeQuotations return status CANCELED.', async () => {
      const {
        sut,
        mockGetExchangeQuotationRepository,
        mockGetGateway,
        mockEmitEventCanceled,
      } = makeSut();

      const exchangeQuotationCanceled =
        await ExchangeQuotationFactory.create<ExchangeQuotationEntity>(
          ExchangeQuotationEntity.name,
          {
            state: ExchangeQuotationState.CANCELED,
          },
        );

      mockGetGateway.mockImplementation(MockTestGetExchange.successCanceled);

      mockGetExchangeQuotationRepository.mockResolvedValue([
        exchangeQuotationCanceled,
      ]);

      await sut.execute();
      expect(mockGetExchangeQuotationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetGateway).toHaveBeenCalledTimes(1);
      expect(mockEmitEventCanceled).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should throw if getExchangeQuotationById return error.', async () => {
      const {
        sut,
        mockGetExchangeQuotationRepository,
        mockGetGateway,
        mockEmitEventCanceled,
        mockGetRemittanceExchangeQuotationRepository,
        mockGetRemittanceRepository,
        mockUpdateRemittanceRepository,
      } = makeSut();

      const exchangeQuotationCanceled =
        await ExchangeQuotationFactory.create<ExchangeQuotationEntity>(
          ExchangeQuotationEntity.name,
          {
            state: ExchangeQuotationState.CANCELED,
          },
        );

      mockGetGateway.mockImplementation(() => {
        throw new ExchangeQuotationNotFoundPspException(new Error());
      });

      mockGetExchangeQuotationRepository.mockResolvedValue([
        exchangeQuotationCanceled,
      ]);

      const exchangeQuotation =
        await ExchangeQuotationFactory.create<ExchangeQuotationEntity>(
          ExchangeQuotationEntity.name,
          { state: ExchangeQuotationState.PENDING },
        );

      const remittance = await RemittanceFactory.create<RemittanceEntity>(
        RemittanceEntity.name,
      );

      const remittanceExchangeQuotation =
        await RemittanceExchangeQuotationFactory.create<RemittanceExchangeQuotationEntity>(
          RemittanceExchangeQuotationEntity.name,
          { exchangeQuotation, remittance },
        );

      mockGetRemittanceExchangeQuotationRepository.mockResolvedValue([
        remittanceExchangeQuotation,
      ]);

      await sut.execute();

      expect(mockGetExchangeQuotationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetGateway).toHaveBeenCalledTimes(1);
      expect(mockEmitEventCanceled).toHaveBeenCalledTimes(0);
      expect(
        mockGetRemittanceExchangeQuotationRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRemittanceRepository).toHaveBeenCalledTimes(1);
    });
  });
});
