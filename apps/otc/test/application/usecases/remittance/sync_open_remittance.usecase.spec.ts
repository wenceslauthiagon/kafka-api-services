import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { getMoment, defaultLogger as logger } from '@zro/common';
import {
  RemittanceCurrentGroupEntity,
  RemittanceCurrentGroupRepository,
  RemittanceEntity,
  RemittanceOrderRemittanceEntity,
  RemittanceOrderRemittanceRepository,
  RemittanceRepository,
  RemittanceStatus,
  settlementDateCodes,
} from '@zro/otc/domain';
import { HolidayEntity, HolidayType } from '@zro/quotations/domain';
import {
  SyncOpenRemittanceUseCase as UseCase,
  RemittanceEventEmitter,
  ExchangeQuotationEventEmitter,
  OperationService,
  QuotationService,
  UtilService,
} from '@zro/otc/application';
import { CurrencyNotFoundException } from '@zro/operations/application';
import {
  RemittanceCurrentGroupFactory,
  RemittanceFactory,
  RemittanceOrderRemittanceFactory,
} from '@zro/test/otc/config';
import { HolidayFactory } from '@zro/test/quotations/config';
import { FeatureSettingFactory } from '@zro/test/utils/config';
import {
  FeatureSettingEntity,
  FeatureSettingName,
  FeatureSettingState,
} from '@zro/utils/domain';

const defaultSettlementDate = 'D0;D0';
const [sendDate, receiveDate] = settlementDateCodes(defaultSettlementDate);
const pspSettlementDateByStartingTime = '';
const pspSettlementDateByStartingTime1 = '09:05_D0-D0;14:31_D1-D1';
const pspMarketOpenTime = '9:05';
const pspMarketCloseTime = '16:33';
const pspTradeMinAmount = 500000;
const pspTradeMaxAmount = 99999900;
const pspDailyMaxAmount = 1000000000;

describe('SyncCreateRemittanceUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const exchangeQuotationEventEmitter: ExchangeQuotationEventEmitter =
      createMock<ExchangeQuotationEventEmitter>();
    const mockReadyExchangeQuotationEvent: jest.Mock = On(
      exchangeQuotationEventEmitter,
    ).get(method((mock) => mock.readyExchangeQuotation));

    const remittanceEventEmitter: RemittanceEventEmitter =
      createMock<RemittanceEventEmitter>();
    const mockCreatedRemittanceEvent: jest.Mock = On(
      remittanceEventEmitter,
    ).get(method((mock) => mock.createdRemittance));
    const mockClosedRemittanceEvent: jest.Mock = On(remittanceEventEmitter).get(
      method((mock) => mock.closedRemittance),
    );
    const mockWaitingRemittanceEvent: jest.Mock = On(
      remittanceEventEmitter,
    ).get(method((mock) => mock.waitingRemittance));

    return {
      exchangeQuotationEventEmitter,
      mockReadyExchangeQuotationEvent,
      remittanceEventEmitter,
      mockCreatedRemittanceEvent,
      mockClosedRemittanceEvent,
      mockWaitingRemittanceEvent,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetCurrencyByIdOperationService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getCurrencyById));

    const quotationService: QuotationService = createMock<QuotationService>();
    const mockGetByDateHolidayQuotationService: jest.Mock = On(
      quotationService,
    ).get(method((mock) => mock.getHolidayByDate));

    const utilService: UtilService = createMock<UtilService>();
    const mockGetFeatureSettingByName: jest.Mock = On(utilService).get(
      method((mock) => mock.getFeatureSettingByName),
    );

    return {
      operationService,
      mockGetCurrencyByIdOperationService,
      quotationService,
      mockGetByDateHolidayQuotationService,
      utilService,
      mockGetFeatureSettingByName,
    };
  };

  const mockRepository = () => {
    const remittanceCurrentGroupCacheRepository: RemittanceCurrentGroupRepository =
      createMock<RemittanceCurrentGroupRepository>();
    const mockGetCurrentGroupCacheRepository: jest.Mock = On(
      remittanceCurrentGroupCacheRepository,
    ).get(
      method(
        (mock) =>
          mock.getByCurrencySystemProviderSendDateCodeAndReceiveDateCode,
      ),
    );
    const mockCreateOrUpdateCacheRepository: jest.Mock = On(
      remittanceCurrentGroupCacheRepository,
    ).get(method((mock) => mock.createOrUpdate));

    const remittanceRepository: RemittanceRepository =
      createMock<RemittanceRepository>();
    const mockCreateRemittanceRepository: jest.Mock = On(
      remittanceRepository,
    ).get(method((mock) => mock.create));
    const mockGetByIdRemittanceRepository: jest.Mock = On(
      remittanceRepository,
    ).get(method((mock) => mock.getById));
    const mockUpdateRemittanceRepository: jest.Mock = On(
      remittanceRepository,
    ).get(method((mock) => mock.update));
    const mockGetAllOpenRemittanceRepository: jest.Mock = On(
      remittanceRepository,
    ).get(method((mock) => mock.getAllByStatus));

    const remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository =
      createMock<RemittanceOrderRemittanceRepository>();
    const mockCreateRemittanceOrderRemittanceRepository: jest.Mock = On(
      remittanceOrderRemittanceRepository,
    ).get(method((mock) => mock.create));
    const mockGetAllRemittanceOrderRemittanceRepository: jest.Mock = On(
      remittanceOrderRemittanceRepository,
    ).get(method((mock) => mock.getAllByRemittance));

    return {
      remittanceCurrentGroupCacheRepository,
      mockGetCurrentGroupCacheRepository,
      mockCreateOrUpdateCacheRepository,
      remittanceRepository,
      mockCreateRemittanceRepository,
      mockGetByIdRemittanceRepository,
      mockUpdateRemittanceRepository,
      mockGetAllOpenRemittanceRepository,
      remittanceOrderRemittanceRepository,
      mockCreateRemittanceOrderRemittanceRepository,
      mockGetAllRemittanceOrderRemittanceRepository,
    };
  };

  const makeSut = () => {
    const {
      exchangeQuotationEventEmitter,
      mockReadyExchangeQuotationEvent,
      remittanceEventEmitter,
      mockCreatedRemittanceEvent,
      mockClosedRemittanceEvent,
      mockWaitingRemittanceEvent,
    } = mockEmitter();

    const {
      remittanceCurrentGroupCacheRepository,
      mockGetCurrentGroupCacheRepository,
      mockCreateOrUpdateCacheRepository,
      remittanceRepository,
      mockCreateRemittanceRepository,
      mockGetByIdRemittanceRepository,
      mockUpdateRemittanceRepository,
      mockGetAllOpenRemittanceRepository,
      remittanceOrderRemittanceRepository,
      mockCreateRemittanceOrderRemittanceRepository,
      mockGetAllRemittanceOrderRemittanceRepository,
    } = mockRepository();

    const {
      operationService,
      mockGetCurrencyByIdOperationService,
      quotationService,
      mockGetByDateHolidayQuotationService,
      utilService,
      mockGetFeatureSettingByName,
    } = mockService();

    const sut = new UseCase(
      logger,
      remittanceCurrentGroupCacheRepository,
      remittanceOrderRemittanceRepository,
      operationService,
      quotationService,
      utilService,
      sendDate,
      receiveDate,
      remittanceRepository,
      remittanceEventEmitter,
      exchangeQuotationEventEmitter,
      pspSettlementDateByStartingTime,
      pspMarketOpenTime,
      pspMarketCloseTime,
      pspTradeMinAmount,
      pspTradeMaxAmount,
      pspDailyMaxAmount,
    );

    // With specific pspSettlementDateByStartingTime
    const sut1 = new UseCase(
      logger,
      remittanceCurrentGroupCacheRepository,
      remittanceOrderRemittanceRepository,
      operationService,
      quotationService,
      utilService,
      sendDate,
      receiveDate,
      remittanceRepository,
      remittanceEventEmitter,
      exchangeQuotationEventEmitter,
      pspSettlementDateByStartingTime1,
      pspMarketOpenTime,
      pspMarketCloseTime,
      pspTradeMinAmount,
      pspTradeMaxAmount,
      pspDailyMaxAmount,
    );

    return {
      sut,
      sut1,
      mockReadyExchangeQuotationEvent,
      mockCreatedRemittanceEvent,
      mockGetCurrencyByIdOperationService,
      mockGetByDateHolidayQuotationService,
      mockGetCurrentGroupCacheRepository,
      mockCreateOrUpdateCacheRepository,
      mockCreateRemittanceRepository,
      mockGetByIdRemittanceRepository,
      mockUpdateRemittanceRepository,
      mockGetAllOpenRemittanceRepository,
      mockCreateRemittanceOrderRemittanceRepository,
      mockGetAllRemittanceOrderRemittanceRepository,
      mockClosedRemittanceEvent,
      mockWaitingRemittanceEvent,
      mockGetFeatureSettingByName,
    };
  };

  describe('With invalid parameters', () => {
    const openTime = getMoment(pspMarketOpenTime, 'HH:mm');
    const closeTime = getMoment(pspMarketCloseTime, 'HH:mm');
    const now = getMoment();

    if (now <= openTime || now >= closeTime) {
      it('TC0001 - Should return due to psp market is closed.', async () => {
        const {
          sut,
          mockReadyExchangeQuotationEvent,
          mockCreatedRemittanceEvent,
          mockGetByDateHolidayQuotationService,
          mockGetCurrencyByIdOperationService,
          mockGetCurrentGroupCacheRepository,
          mockCreateOrUpdateCacheRepository,
          mockCreateRemittanceRepository,
          mockGetByIdRemittanceRepository,
          mockUpdateRemittanceRepository,
          mockGetAllOpenRemittanceRepository,
          mockCreateRemittanceOrderRemittanceRepository,
          mockGetAllRemittanceOrderRemittanceRepository,
          mockClosedRemittanceEvent,
          mockWaitingRemittanceEvent,
          mockGetFeatureSettingByName,
        } = makeSut();

        const result = await sut.execute();

        expect(result).toBeUndefined();
        expect(mockReadyExchangeQuotationEvent).toHaveBeenCalledTimes(0);
        expect(mockCreatedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetByDateHolidayQuotationService).toHaveBeenCalledTimes(0);
        expect(mockGetCurrencyByIdOperationService).toHaveBeenCalledTimes(0);
        expect(mockGetCurrentGroupCacheRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateOrUpdateCacheRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockUpdateRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetAllOpenRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(
          mockCreateRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(
          mockGetAllRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(mockClosedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockWaitingRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(0);
      });
    } else {
      it('TC0002 - Should return if market is closed due to holiday.', async () => {
        const {
          sut,
          mockReadyExchangeQuotationEvent,
          mockCreatedRemittanceEvent,
          mockGetByDateHolidayQuotationService,
          mockGetCurrencyByIdOperationService,
          mockGetCurrentGroupCacheRepository,
          mockCreateOrUpdateCacheRepository,
          mockCreateRemittanceRepository,
          mockGetByIdRemittanceRepository,
          mockUpdateRemittanceRepository,
          mockGetAllOpenRemittanceRepository,
          mockCreateRemittanceOrderRemittanceRepository,
          mockGetAllRemittanceOrderRemittanceRepository,
          mockClosedRemittanceEvent,
          mockWaitingRemittanceEvent,
          mockGetFeatureSettingByName,
        } = makeSut();

        const featureSetting =
          await FeatureSettingFactory.create<FeatureSettingEntity>(
            FeatureSettingEntity.name,
            {
              name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
              state: FeatureSettingState.ACTIVE,
            },
          );
        mockGetFeatureSettingByName.mockResolvedValueOnce(featureSetting);

        const holiday = await HolidayFactory.create<HolidayEntity>(
          HolidayEntity.name,
          { type: HolidayType.HOLIDAY },
        );

        mockGetByDateHolidayQuotationService.mockResolvedValue(holiday);

        const result = await sut.execute();

        expect(result).toBeUndefined();
        expect(mockReadyExchangeQuotationEvent).toHaveBeenCalledTimes(0);
        expect(mockCreatedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetByDateHolidayQuotationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyByIdOperationService).toHaveBeenCalledTimes(0);
        expect(mockGetCurrentGroupCacheRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateOrUpdateCacheRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockUpdateRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetAllOpenRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(
          mockCreateRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(
          mockGetAllRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(mockClosedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockWaitingRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      });

      it('TC0003 - Should return if no open remittance order is found.', async () => {
        const {
          sut,
          mockReadyExchangeQuotationEvent,
          mockCreatedRemittanceEvent,
          mockGetByDateHolidayQuotationService,
          mockGetCurrencyByIdOperationService,
          mockGetCurrentGroupCacheRepository,
          mockCreateOrUpdateCacheRepository,
          mockCreateRemittanceRepository,
          mockGetByIdRemittanceRepository,
          mockUpdateRemittanceRepository,
          mockGetAllOpenRemittanceRepository,
          mockCreateRemittanceOrderRemittanceRepository,
          mockGetAllRemittanceOrderRemittanceRepository,
          mockClosedRemittanceEvent,
          mockWaitingRemittanceEvent,
          mockGetFeatureSettingByName,
        } = makeSut();

        const featureSetting =
          await FeatureSettingFactory.create<FeatureSettingEntity>(
            FeatureSettingEntity.name,
            {
              name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
              state: FeatureSettingState.ACTIVE,
            },
          );
        mockGetFeatureSettingByName.mockResolvedValueOnce(featureSetting);

        mockGetByDateHolidayQuotationService.mockResolvedValue(null);

        mockGetAllOpenRemittanceRepository.mockResolvedValue({
          data: [],
          page: 1,
          pageSize: 100,
          pageTotal: 1,
          total: 0,
        });

        const result = await sut.execute();

        expect(result).toBeUndefined();
        expect(mockReadyExchangeQuotationEvent).toHaveBeenCalledTimes(0);
        expect(mockCreatedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetByDateHolidayQuotationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyByIdOperationService).toHaveBeenCalledTimes(0);
        expect(mockGetCurrentGroupCacheRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateOrUpdateCacheRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockUpdateRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetAllOpenRemittanceRepository).toHaveBeenCalledTimes(1);
        expect(
          mockCreateRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(
          mockGetAllRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(mockClosedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockWaitingRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      });

      it('TC0004 - Should throw CurrencyNotFoundException if currency tag is not found.', async () => {
        const {
          sut,
          mockReadyExchangeQuotationEvent,
          mockCreatedRemittanceEvent,
          mockGetByDateHolidayQuotationService,
          mockGetCurrencyByIdOperationService,
          mockGetCurrentGroupCacheRepository,
          mockCreateOrUpdateCacheRepository,
          mockCreateRemittanceRepository,
          mockGetByIdRemittanceRepository,
          mockUpdateRemittanceRepository,
          mockGetAllOpenRemittanceRepository,
          mockCreateRemittanceOrderRemittanceRepository,
          mockGetAllRemittanceOrderRemittanceRepository,
          mockClosedRemittanceEvent,
          mockWaitingRemittanceEvent,
          mockGetFeatureSettingByName,
        } = makeSut();

        const featureSetting =
          await FeatureSettingFactory.create<FeatureSettingEntity>(
            FeatureSettingEntity.name,
            {
              name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
              state: FeatureSettingState.ACTIVE,
            },
          );
        mockGetFeatureSettingByName.mockResolvedValueOnce(featureSetting);

        mockGetByDateHolidayQuotationService.mockResolvedValue(null);

        const remittance = await RemittanceFactory.create<RemittanceEntity>(
          RemittanceEntity.name,
          { status: RemittanceStatus.OPEN },
        );

        mockGetAllOpenRemittanceRepository.mockResolvedValue({
          data: [remittance],
          page: 1,
          pageSize: 100,
          pageTotal: 1,
          total: 1,
        });
        mockGetCurrencyByIdOperationService.mockResolvedValue(null);

        const testScript = () => sut.execute();

        await expect(testScript).rejects.toThrow(CurrencyNotFoundException);
        expect(mockReadyExchangeQuotationEvent).toHaveBeenCalledTimes(0);
        expect(mockCreatedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetByDateHolidayQuotationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyByIdOperationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrentGroupCacheRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateOrUpdateCacheRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockUpdateRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetAllOpenRemittanceRepository).toHaveBeenCalledTimes(1);
        expect(
          mockCreateRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(
          mockGetAllRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(mockClosedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockWaitingRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      });

      it('TC0005 - Should not send remittances to PSP if daily amount exceeds the limit.', async () => {
        const {
          sut,
          mockReadyExchangeQuotationEvent,
          mockCreatedRemittanceEvent,
          mockGetByDateHolidayQuotationService,
          mockGetCurrencyByIdOperationService,
          mockGetCurrentGroupCacheRepository,
          mockCreateOrUpdateCacheRepository,
          mockCreateRemittanceRepository,
          mockGetByIdRemittanceRepository,
          mockUpdateRemittanceRepository,
          mockGetAllOpenRemittanceRepository,
          mockCreateRemittanceOrderRemittanceRepository,
          mockGetAllRemittanceOrderRemittanceRepository,
          mockClosedRemittanceEvent,
          mockWaitingRemittanceEvent,
          mockGetFeatureSettingByName,
        } = makeSut();

        const featureSetting =
          await FeatureSettingFactory.create<FeatureSettingEntity>(
            FeatureSettingEntity.name,
            {
              name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
              state: FeatureSettingState.ACTIVE,
            },
          );
        mockGetFeatureSettingByName.mockResolvedValueOnce(featureSetting);

        mockGetByDateHolidayQuotationService.mockResolvedValue(null);

        const remittance = await RemittanceFactory.create<RemittanceEntity>(
          RemittanceEntity.name,
        );

        mockGetAllOpenRemittanceRepository.mockResolvedValue({
          data: [remittance],
          page: 1,
          pageSize: 100,
          pageTotal: 1,
          total: 1,
        });
        mockGetCurrencyByIdOperationService.mockResolvedValue(
          remittance.currency,
        );

        const currentGroup =
          await RemittanceCurrentGroupFactory.create<RemittanceCurrentGroupEntity>(
            RemittanceCurrentGroupEntity.name,
            {
              dailyAmount: pspDailyMaxAmount,
              dailyRemittanceGroup: [uuidV4()],
              dailyAmountDate: getMoment().toDate(),
            },
          );

        mockGetCurrentGroupCacheRepository.mockResolvedValue(currentGroup);
        mockGetByIdRemittanceRepository.mockResolvedValue(remittance);

        const result = await sut.execute();

        expect(result).toBeUndefined();
        expect(mockReadyExchangeQuotationEvent).toHaveBeenCalledTimes(0);
        expect(mockCreatedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetByDateHolidayQuotationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyByIdOperationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrentGroupCacheRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateOrUpdateCacheRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(1);
        expect(mockUpdateRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetAllOpenRemittanceRepository).toHaveBeenCalledTimes(1);
        expect(
          mockCreateRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(
          mockGetAllRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(mockClosedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockWaitingRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      });

      it('TC0006 - Should not execute if feature setting is turned off.', async () => {
        const {
          sut,
          mockReadyExchangeQuotationEvent,
          mockCreatedRemittanceEvent,
          mockGetByDateHolidayQuotationService,
          mockGetCurrencyByIdOperationService,
          mockGetCurrentGroupCacheRepository,
          mockCreateOrUpdateCacheRepository,
          mockCreateRemittanceRepository,
          mockGetByIdRemittanceRepository,
          mockUpdateRemittanceRepository,
          mockGetAllOpenRemittanceRepository,
          mockCreateRemittanceOrderRemittanceRepository,
          mockGetAllRemittanceOrderRemittanceRepository,
          mockClosedRemittanceEvent,
          mockWaitingRemittanceEvent,
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
        mockGetFeatureSettingByName.mockResolvedValueOnce(featureSetting);

        const result = await sut.execute();

        expect(result).toBeUndefined();
        expect(mockReadyExchangeQuotationEvent).toHaveBeenCalledTimes(0);
        expect(mockCreatedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetByDateHolidayQuotationService).toHaveBeenCalledTimes(0);
        expect(mockGetCurrencyByIdOperationService).toHaveBeenCalledTimes(0);
        expect(mockGetCurrentGroupCacheRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateOrUpdateCacheRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockUpdateRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetAllOpenRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(
          mockCreateRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(
          mockGetAllRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(mockClosedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockWaitingRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      });
    }
  });

  describe('With valid parameters', () => {
    const openTime = getMoment(pspMarketOpenTime, 'HH:mm');
    const closeTime = getMoment(pspMarketCloseTime, 'HH:mm');
    const now = getMoment();

    if (now > openTime && now < closeTime) {
      it('TC0007 - Should close concomitant remittances successfully.', async () => {
        const {
          sut,
          mockReadyExchangeQuotationEvent,
          mockCreatedRemittanceEvent,
          mockGetByDateHolidayQuotationService,
          mockGetCurrencyByIdOperationService,
          mockGetCurrentGroupCacheRepository,
          mockCreateOrUpdateCacheRepository,
          mockCreateRemittanceRepository,
          mockGetByIdRemittanceRepository,
          mockUpdateRemittanceRepository,
          mockGetAllOpenRemittanceRepository,
          mockCreateRemittanceOrderRemittanceRepository,
          mockGetAllRemittanceOrderRemittanceRepository,
          mockClosedRemittanceEvent,
          mockWaitingRemittanceEvent,
          mockGetFeatureSettingByName,
        } = makeSut();

        const featureSetting =
          await FeatureSettingFactory.create<FeatureSettingEntity>(
            FeatureSettingEntity.name,
            {
              name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
              state: FeatureSettingState.ACTIVE,
            },
          );
        mockGetFeatureSettingByName.mockResolvedValueOnce(featureSetting);

        mockGetByDateHolidayQuotationService.mockResolvedValue(null);

        const remittance = await RemittanceFactory.create<RemittanceEntity>(
          RemittanceEntity.name,
          {
            status: RemittanceStatus.OPEN,
            amount: 500000,
          },
        );

        mockGetAllOpenRemittanceRepository.mockResolvedValue({
          data: [remittance],
          page: 1,
          pageSize: 100,
          pageTotal: 1,
          total: 1,
        });
        mockGetCurrencyByIdOperationService.mockResolvedValue(
          remittance.currency,
        );

        const pastRemittance = await RemittanceFactory.create<RemittanceEntity>(
          RemittanceEntity.name,
          {
            status: RemittanceStatus.OPEN,
            amount: -500000,
          },
        );

        const currentGroup =
          await RemittanceCurrentGroupFactory.create<RemittanceCurrentGroupEntity>(
            RemittanceCurrentGroupEntity.name,
            {
              groupAmount: pastRemittance.amount,
              remittanceGroup: [pastRemittance.id],
            },
          );

        mockGetCurrentGroupCacheRepository.mockResolvedValue(currentGroup);
        mockGetByIdRemittanceRepository.mockResolvedValueOnce(pastRemittance);
        mockGetByIdRemittanceRepository.mockResolvedValueOnce(remittance);

        const result = await sut.execute();

        expect(result).toBeUndefined();
        expect(mockReadyExchangeQuotationEvent).toHaveBeenCalledTimes(0);
        expect(mockCreatedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetByDateHolidayQuotationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyByIdOperationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrentGroupCacheRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateOrUpdateCacheRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(3);
        expect(mockUpdateRemittanceRepository).toHaveBeenCalledTimes(2);
        expect(mockGetAllOpenRemittanceRepository).toHaveBeenCalledTimes(1);
        expect(
          mockCreateRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(
          mockGetAllRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(mockClosedRemittanceEvent).toHaveBeenCalledTimes(2);
        expect(mockWaitingRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      });

      it('TC0008 - Should send remittances to PSP successfully.', async () => {
        const {
          sut,
          mockReadyExchangeQuotationEvent,
          mockCreatedRemittanceEvent,
          mockGetByDateHolidayQuotationService,
          mockGetCurrencyByIdOperationService,
          mockGetCurrentGroupCacheRepository,
          mockCreateOrUpdateCacheRepository,
          mockCreateRemittanceRepository,
          mockGetByIdRemittanceRepository,
          mockUpdateRemittanceRepository,
          mockGetAllOpenRemittanceRepository,
          mockCreateRemittanceOrderRemittanceRepository,
          mockGetAllRemittanceOrderRemittanceRepository,
          mockClosedRemittanceEvent,
          mockWaitingRemittanceEvent,
          mockGetFeatureSettingByName,
        } = makeSut();

        const featureSetting =
          await FeatureSettingFactory.create<FeatureSettingEntity>(
            FeatureSettingEntity.name,
            {
              name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
              state: FeatureSettingState.ACTIVE,
            },
          );
        mockGetFeatureSettingByName.mockResolvedValueOnce(featureSetting);

        mockGetByDateHolidayQuotationService.mockResolvedValue(null);

        const remittance = await RemittanceFactory.create<RemittanceEntity>(
          RemittanceEntity.name,
          {
            status: RemittanceStatus.OPEN,
            amount: 500000,
          },
        );

        mockGetAllOpenRemittanceRepository.mockResolvedValue({
          data: [remittance],
          page: 1,
          pageSize: 100,
          pageTotal: 1,
          total: 1,
        });
        mockGetCurrencyByIdOperationService.mockResolvedValue(
          remittance.currency,
        );
        mockGetCurrentGroupCacheRepository.mockResolvedValue(null);
        mockGetByIdRemittanceRepository.mockResolvedValue(remittance);

        const result = await sut.execute();

        expect(result).toBeUndefined();
        expect(mockReadyExchangeQuotationEvent).toHaveBeenCalledTimes(1);
        expect(mockCreatedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetByDateHolidayQuotationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyByIdOperationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrentGroupCacheRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateOrUpdateCacheRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(2);
        expect(mockUpdateRemittanceRepository).toHaveBeenCalledTimes(1);
        expect(mockGetAllOpenRemittanceRepository).toHaveBeenCalledTimes(1);
        expect(
          mockCreateRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(
          mockGetAllRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(mockClosedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockWaitingRemittanceEvent).toHaveBeenCalledTimes(1);
        expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      });

      it('TC0009 - Should split last remittance due to amount is over psp maximum trade amount and send remittances to PSP successfully.', async () => {
        const {
          sut,
          mockReadyExchangeQuotationEvent,
          mockCreatedRemittanceEvent,
          mockGetByDateHolidayQuotationService,
          mockGetCurrencyByIdOperationService,
          mockGetCurrentGroupCacheRepository,
          mockCreateOrUpdateCacheRepository,
          mockCreateRemittanceRepository,
          mockGetByIdRemittanceRepository,
          mockUpdateRemittanceRepository,
          mockGetAllOpenRemittanceRepository,
          mockCreateRemittanceOrderRemittanceRepository,
          mockGetAllRemittanceOrderRemittanceRepository,
          mockClosedRemittanceEvent,
          mockWaitingRemittanceEvent,
          mockGetFeatureSettingByName,
        } = makeSut();

        const featureSetting =
          await FeatureSettingFactory.create<FeatureSettingEntity>(
            FeatureSettingEntity.name,
            {
              name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
              state: FeatureSettingState.ACTIVE,
            },
          );
        mockGetFeatureSettingByName.mockResolvedValueOnce(featureSetting);

        const remittance = await RemittanceFactory.create<RemittanceEntity>(
          RemittanceEntity.name,
          {
            status: RemittanceStatus.OPEN,
            amount: 100000000,
          },
        );

        const remittanceOrderRemittance =
          await RemittanceOrderRemittanceFactory.create<RemittanceOrderRemittanceEntity>(
            RemittanceOrderRemittanceEntity.name,
            {
              remittance,
            },
          );

        mockGetByDateHolidayQuotationService.mockResolvedValue(null);
        mockGetAllOpenRemittanceRepository.mockResolvedValue({
          data: [remittance],
          page: 1,
          pageSize: 100,
          pageTotal: 1,
          total: 1,
        });
        mockGetCurrencyByIdOperationService.mockResolvedValue(
          remittance.currency,
        );
        mockGetCurrentGroupCacheRepository.mockResolvedValue(null);
        mockGetByIdRemittanceRepository.mockResolvedValue(remittance);
        mockGetAllRemittanceOrderRemittanceRepository.mockResolvedValue([
          remittanceOrderRemittance,
        ]);

        const result = await sut.execute();

        expect(result).toBeUndefined();
        expect(mockReadyExchangeQuotationEvent).toHaveBeenCalledTimes(1);
        expect(mockCreatedRemittanceEvent).toHaveBeenCalledTimes(1);
        expect(mockGetByDateHolidayQuotationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyByIdOperationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrentGroupCacheRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateOrUpdateCacheRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateRemittanceRepository).toHaveBeenCalledTimes(1);
        expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(2);
        expect(mockUpdateRemittanceRepository).toHaveBeenCalledTimes(2);
        expect(mockGetAllOpenRemittanceRepository).toHaveBeenCalledTimes(1);
        expect(
          mockCreateRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(1);
        expect(
          mockGetAllRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(1);
        expect(mockClosedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockWaitingRemittanceEvent).toHaveBeenCalledTimes(1);
        expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      });

      it('TC0010 - Should send remittances to PSP respecting the PSP settlement day config successfully.', async () => {
        const {
          sut1,
          mockReadyExchangeQuotationEvent,
          mockCreatedRemittanceEvent,
          mockGetByDateHolidayQuotationService,
          mockGetCurrencyByIdOperationService,
          mockGetCurrentGroupCacheRepository,
          mockCreateOrUpdateCacheRepository,
          mockCreateRemittanceRepository,
          mockGetByIdRemittanceRepository,
          mockUpdateRemittanceRepository,
          mockGetAllOpenRemittanceRepository,
          mockCreateRemittanceOrderRemittanceRepository,
          mockGetAllRemittanceOrderRemittanceRepository,
          mockClosedRemittanceEvent,
          mockWaitingRemittanceEvent,
          mockGetFeatureSettingByName,
        } = makeSut();

        const featureSetting =
          await FeatureSettingFactory.create<FeatureSettingEntity>(
            FeatureSettingEntity.name,
            {
              name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
              state: FeatureSettingState.ACTIVE,
            },
          );
        mockGetFeatureSettingByName.mockResolvedValueOnce(featureSetting);

        mockGetByDateHolidayQuotationService.mockResolvedValue(null);

        const remittance = await RemittanceFactory.create<RemittanceEntity>(
          RemittanceEntity.name,
          {
            status: RemittanceStatus.OPEN,
            amount: 500000,
          },
        );

        mockGetAllOpenRemittanceRepository.mockResolvedValue({
          data: [remittance],
          page: 1,
          pageSize: 100,
          pageTotal: 1,
          total: 1,
        });
        mockGetCurrencyByIdOperationService.mockResolvedValue(
          remittance.currency,
        );
        mockGetCurrentGroupCacheRepository.mockResolvedValue(null);
        mockGetByIdRemittanceRepository.mockResolvedValue(remittance);

        const result = await sut1.execute();

        expect(result).toBeUndefined();
        expect(mockReadyExchangeQuotationEvent).toHaveBeenCalledTimes(1);
        expect(mockCreatedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockGetByDateHolidayQuotationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyByIdOperationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrentGroupCacheRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateOrUpdateCacheRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateRemittanceRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdRemittanceRepository).toHaveBeenCalledTimes(2);
        expect(mockUpdateRemittanceRepository).toHaveBeenCalledTimes(1);
        expect(mockGetAllOpenRemittanceRepository).toHaveBeenCalledTimes(1);
        expect(
          mockCreateRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(
          mockGetAllRemittanceOrderRemittanceRepository,
        ).toHaveBeenCalledTimes(0);
        expect(mockClosedRemittanceEvent).toHaveBeenCalledTimes(0);
        expect(mockWaitingRemittanceEvent).toHaveBeenCalledTimes(1);
        expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
      });
    }
  });
});
