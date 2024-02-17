import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { CurrencyEntity } from '@zro/operations/domain';
import {
  RemittanceExposureRuleEntity,
  RemittanceExposureRuleRepository,
  RemittanceOrderCurrentGroupEntity,
  RemittanceOrderCurrentGroupRepository,
  RemittanceOrderEntity,
  RemittanceOrderRemittanceRepository,
  RemittanceOrderRepository,
  RemittanceOrderStatus,
  RemittanceRepository,
  settlementDateCodes,
} from '@zro/otc/domain';
import {
  SyncCreateRemittanceUseCase as UseCase,
  RemittanceOrderEventEmitter,
  RemittanceEventEmitter,
  RemittanceExposureRuleNotFoundException,
} from '@zro/otc/application';
import {
  RemittanceExposureRuleFactory,
  RemittanceOrderCurrentGroupFactory,
  RemittanceOrderFactory,
} from '@zro/test/otc/config';
import { CurrencyFactory } from '@zro/test/operations/config';

describe('SyncCreateRemittanceUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const remittanceOrderEventEmitter: RemittanceOrderEventEmitter =
      createMock<RemittanceOrderEventEmitter>();
    const mockClosedRemittanceOrderEvent: jest.Mock = On(
      remittanceOrderEventEmitter,
    ).get(method((mock) => mock.closedRemittanceOrder));

    const remittanceEventEmitter: RemittanceEventEmitter =
      createMock<RemittanceEventEmitter>();
    const mockCreatedRemittanceEvent: jest.Mock = On(
      remittanceEventEmitter,
    ).get(method((mock) => mock.createdRemittance));

    return {
      remittanceOrderEventEmitter,
      mockClosedRemittanceOrderEvent,
      remittanceEventEmitter,
      mockCreatedRemittanceEvent,
    };
  };

  const mockRepository = () => {
    const remittanceOrderRepository: RemittanceOrderRepository =
      createMock<RemittanceOrderRepository>();
    const mockGetAllOpenRemittanceOrderRepository: jest.Mock = On(
      remittanceOrderRepository,
    ).get(method((mock) => mock.getAllByStatus));
    const mockGetByIdRemittanceOrderRepository: jest.Mock = On(
      remittanceOrderRepository,
    ).get(method((mock) => mock.getById));
    const mockUpdateRemittanceOrderRepository: jest.Mock = On(
      remittanceOrderRepository,
    ).get(method((mock) => mock.update));

    const remittanceOrderCurrentGroupCacheRepository: RemittanceOrderCurrentGroupRepository =
      createMock<RemittanceOrderCurrentGroupRepository>();
    const mockGetCurrentGroupCacheRepository: jest.Mock = On(
      remittanceOrderCurrentGroupCacheRepository,
    ).get(
      method(
        (mock) =>
          mock.getByCurrencySystemProviderSendDateCodeAndReceiveDateCode,
      ),
    );
    const mockCreateOrUpdateCacheRepository: jest.Mock = On(
      remittanceOrderCurrentGroupCacheRepository,
    ).get(method((mock) => mock.createOrUpdate));

    const remittanceExposureRuleRepository: RemittanceExposureRuleRepository =
      createMock<RemittanceExposureRuleRepository>();
    const mockGetByCurrencyRemittanceExposureRule: jest.Mock = On(
      remittanceExposureRuleRepository,
    ).get(method((mock) => mock.getByCurrency));

    const remittanceRepository: RemittanceRepository =
      createMock<RemittanceRepository>();
    const mockCreateRemittanceRepository: jest.Mock = On(
      remittanceRepository,
    ).get(method((mock) => mock.create));

    const remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository =
      createMock<RemittanceOrderRemittanceRepository>();
    const mockCreateRemittaRemittanceOrderRemittanceRepository: jest.Mock = On(
      remittanceOrderRemittanceRepository,
    ).get(method((mock) => mock.create));

    return {
      remittanceOrderRepository,
      mockGetAllOpenRemittanceOrderRepository,
      mockGetByIdRemittanceOrderRepository,
      mockUpdateRemittanceOrderRepository,
      remittanceOrderCurrentGroupCacheRepository,
      mockGetCurrentGroupCacheRepository,
      mockCreateOrUpdateCacheRepository,
      remittanceExposureRuleRepository,
      mockGetByCurrencyRemittanceExposureRule,
      remittanceRepository,
      mockCreateRemittanceRepository,
      remittanceOrderRemittanceRepository,
      mockCreateRemittaRemittanceOrderRemittanceRepository,
    };
  };

  const makeSut = () => {
    const defaultSettlementDate = 'D0;D0';
    const [sendDate, receiveDate] = settlementDateCodes(defaultSettlementDate);

    const {
      remittanceOrderEventEmitter,
      mockClosedRemittanceOrderEvent,
      remittanceEventEmitter,
      mockCreatedRemittanceEvent,
    } = mockEmitter();

    const {
      remittanceOrderRepository,
      mockGetAllOpenRemittanceOrderRepository,
      mockGetByIdRemittanceOrderRepository,
      mockUpdateRemittanceOrderRepository,
      remittanceOrderCurrentGroupCacheRepository,
      mockGetCurrentGroupCacheRepository,
      mockCreateOrUpdateCacheRepository,
      remittanceExposureRuleRepository,
      mockGetByCurrencyRemittanceExposureRule,
      remittanceRepository,
      mockCreateRemittanceRepository,
      remittanceOrderRemittanceRepository,
      mockCreateRemittaRemittanceOrderRemittanceRepository,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      remittanceOrderRepository,
      remittanceOrderCurrentGroupCacheRepository,
      sendDate,
      receiveDate,
      remittanceExposureRuleRepository,
      remittanceRepository,
      remittanceOrderEventEmitter,
      remittanceEventEmitter,
      remittanceOrderRemittanceRepository,
    );

    return {
      sut,
      mockClosedRemittanceOrderEvent,
      mockCreatedRemittanceEvent,
      mockGetAllOpenRemittanceOrderRepository,
      mockGetByIdRemittanceOrderRepository,
      mockUpdateRemittanceOrderRepository,
      mockGetCurrentGroupCacheRepository,
      mockCreateOrUpdateCacheRepository,
      mockGetByCurrencyRemittanceExposureRule,
      mockCreateRemittanceRepository,
      mockCreateRemittaRemittanceOrderRemittanceRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should return if no open remittance order is found.', async () => {
      const {
        sut,
        mockClosedRemittanceOrderEvent,
        mockCreatedRemittanceEvent,
        mockGetAllOpenRemittanceOrderRepository,
        mockGetByIdRemittanceOrderRepository,
        mockUpdateRemittanceOrderRepository,
        mockGetCurrentGroupCacheRepository,
        mockCreateOrUpdateCacheRepository,
        mockGetByCurrencyRemittanceExposureRule,
        mockCreateRemittanceRepository,
        mockCreateRemittaRemittanceOrderRemittanceRepository,
      } = makeSut();

      mockGetAllOpenRemittanceOrderRepository.mockResolvedValue({
        data: [],
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 0,
      });

      await sut.execute();

      expect(mockClosedRemittanceOrderEvent).toHaveBeenCalledTimes(0);
      expect(mockCreatedRemittanceEvent).toHaveBeenCalledTimes(0);
      expect(mockGetAllOpenRemittanceOrderRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentGroupCacheRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateOrUpdateCacheRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByCurrencyRemittanceExposureRule).toHaveBeenCalledTimes(0);
      expect(mockCreateRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(
        mockCreateRemittaRemittanceOrderRemittanceRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should return if no rule is found.', async () => {
      const {
        sut,
        mockClosedRemittanceOrderEvent,
        mockCreatedRemittanceEvent,
        mockGetAllOpenRemittanceOrderRepository,
        mockGetByIdRemittanceOrderRepository,
        mockUpdateRemittanceOrderRepository,
        mockGetCurrentGroupCacheRepository,
        mockCreateOrUpdateCacheRepository,
        mockGetByCurrencyRemittanceExposureRule,
        mockCreateRemittanceRepository,
        mockCreateRemittaRemittanceOrderRemittanceRepository,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const openRemittanceOrders =
        await RemittanceOrderFactory.createMany<RemittanceOrderEntity>(
          RemittanceOrderEntity.name,
          3,
          { status: RemittanceOrderStatus.OPEN, currency },
        );

      const currentGroup =
        await RemittanceOrderCurrentGroupFactory.create<RemittanceOrderCurrentGroupEntity>(
          RemittanceOrderCurrentGroupEntity.name,
          { currency },
        );

      mockGetAllOpenRemittanceOrderRepository.mockResolvedValue({
        data: openRemittanceOrders,
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 3,
      });

      mockGetCurrentGroupCacheRepository.mockResolvedValue(currentGroup);
      mockGetByCurrencyRemittanceExposureRule.mockResolvedValue(null);

      const testScript = () => sut.execute();

      await expect(testScript).rejects.toThrow(
        RemittanceExposureRuleNotFoundException,
      );
      expect(mockClosedRemittanceOrderEvent).toHaveBeenCalledTimes(0);
      expect(mockCreatedRemittanceEvent).toHaveBeenCalledTimes(0);
      expect(mockGetAllOpenRemittanceOrderRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentGroupCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateOrUpdateCacheRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByCurrencyRemittanceExposureRule).toHaveBeenCalledTimes(1);
      expect(mockCreateRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(
        mockCreateRemittaRemittanceOrderRemittanceRepository,
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should not create remittance, but update current group.', async () => {
      const {
        sut,
        mockClosedRemittanceOrderEvent,
        mockCreatedRemittanceEvent,
        mockGetAllOpenRemittanceOrderRepository,
        mockGetByIdRemittanceOrderRepository,
        mockUpdateRemittanceOrderRepository,
        mockGetCurrentGroupCacheRepository,
        mockCreateOrUpdateCacheRepository,
        mockGetByCurrencyRemittanceExposureRule,
        mockCreateRemittanceRepository,
        mockCreateRemittaRemittanceOrderRemittanceRepository,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const openRemittanceOrders = [
        await RemittanceOrderFactory.create<RemittanceOrderEntity>(
          RemittanceOrderEntity.name,
          { status: RemittanceOrderStatus.OPEN, currency, amount: 100000 },
        ),
      ];

      const currentGroup =
        await RemittanceOrderCurrentGroupFactory.create<RemittanceOrderCurrentGroupEntity>(
          RemittanceOrderCurrentGroupEntity.name,
          { currency, groupAmount: 300000 },
        );

      const exposureRule =
        await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
          RemittanceExposureRuleEntity.name,
          { currency, amount: 500000, seconds: 900 },
        );

      mockGetAllOpenRemittanceOrderRepository.mockResolvedValue({
        data: openRemittanceOrders,
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 3,
      });
      mockGetCurrentGroupCacheRepository.mockResolvedValue(currentGroup);
      mockGetByCurrencyRemittanceExposureRule.mockResolvedValue(exposureRule);

      await sut.execute();

      expect(mockClosedRemittanceOrderEvent).toHaveBeenCalledTimes(0);
      expect(mockCreatedRemittanceEvent).toHaveBeenCalledTimes(0);
      expect(mockGetAllOpenRemittanceOrderRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentGroupCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateOrUpdateCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByCurrencyRemittanceExposureRule).toHaveBeenCalledTimes(1);
      expect(mockCreateRemittanceRepository).toHaveBeenCalledTimes(0);
      expect(
        mockCreateRemittaRemittanceOrderRemittanceRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should create new remittance and update current group.', async () => {
      const {
        sut,
        mockClosedRemittanceOrderEvent,
        mockCreatedRemittanceEvent,
        mockGetAllOpenRemittanceOrderRepository,
        mockGetByIdRemittanceOrderRepository,
        mockUpdateRemittanceOrderRepository,
        mockGetCurrentGroupCacheRepository,
        mockCreateOrUpdateCacheRepository,
        mockGetByCurrencyRemittanceExposureRule,
        mockCreateRemittanceRepository,
        mockCreateRemittaRemittanceOrderRemittanceRepository,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const openRemittanceOrders = [
        await RemittanceOrderFactory.create<RemittanceOrderEntity>(
          RemittanceOrderEntity.name,
          { status: RemittanceOrderStatus.OPEN, currency, amount: 200000 },
        ),
      ];

      const currentGroup =
        await RemittanceOrderCurrentGroupFactory.create<RemittanceOrderCurrentGroupEntity>(
          RemittanceOrderCurrentGroupEntity.name,
          { currency, groupAmount: 300000 },
        );

      const exposureRule =
        await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
          RemittanceExposureRuleEntity.name,
          { currency, amount: 500000, seconds: 900 },
        );

      mockGetAllOpenRemittanceOrderRepository.mockResolvedValue({
        data: openRemittanceOrders,
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 3,
      });
      mockGetCurrentGroupCacheRepository.mockResolvedValue(currentGroup);
      mockGetByCurrencyRemittanceExposureRule.mockResolvedValue(exposureRule);

      await sut.execute();

      expect(mockClosedRemittanceOrderEvent).toHaveBeenCalledTimes(2);
      expect(mockCreatedRemittanceEvent).toHaveBeenCalledTimes(1);
      expect(mockGetAllOpenRemittanceOrderRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRemittanceOrderRepository).toHaveBeenCalledTimes(2);
      expect(mockUpdateRemittanceOrderRepository).toHaveBeenCalledTimes(2);
      expect(mockGetCurrentGroupCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateOrUpdateCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByCurrencyRemittanceExposureRule).toHaveBeenCalledTimes(1);
      expect(mockCreateRemittanceRepository).toHaveBeenCalledTimes(1);
      expect(
        mockCreateRemittaRemittanceOrderRemittanceRepository,
      ).toHaveBeenCalledTimes(2);
    });
  });
});
