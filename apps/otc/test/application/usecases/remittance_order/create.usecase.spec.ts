import {
  CreateRemittanceOrderUseCase as UseCase,
  RemittanceOrderEventEmitter,
  OperationService,
  SystemNotFoundException,
  ProviderNotFoundException,
} from '@zro/otc/application';
import {
  ProviderRepository,
  RemittanceOrderEntity,
  RemittanceOrderRepository,
  SystemRepository,
} from '@zro/otc/domain';
import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { RemittanceOrderFactory } from '@zro/test/otc/config';
import { CurrencyNotFoundException } from '@zro/operations/application';

describe('CreateRemittanceOrderUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const remittanceOrderEventEmitter: RemittanceOrderEventEmitter =
      createMock<RemittanceOrderEventEmitter>();
    const mockEmitCreatedEvent: jest.Mock = On(remittanceOrderEventEmitter).get(
      method((mock) => mock.createdRemittanceOrder),
    );

    return {
      remittanceOrderEventEmitter,
      mockEmitCreatedEvent,
    };
  };

  const mockRepository = () => {
    const remittanceOrderRepository: RemittanceOrderRepository =
      createMock<RemittanceOrderRepository>();

    const mockCreateRemittanceOrderRepository: jest.Mock = On(
      remittanceOrderRepository,
    ).get(method((mock) => mock.create));

    const systemRepository: SystemRepository = createMock<SystemRepository>();
    const mockGetByIdSystemRepository: jest.Mock = On(systemRepository).get(
      method((mock) => mock.getById),
    );
    const providerRepository: ProviderRepository =
      createMock<ProviderRepository>();
    const mockGetByIdProviderRepository: jest.Mock = On(providerRepository).get(
      method((mock) => mock.getById),
    );

    return {
      remittanceOrderRepository,
      mockCreateRemittanceOrderRepository,
      systemRepository,
      mockGetByIdSystemRepository,
      providerRepository,
      mockGetByIdProviderRepository,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetCurrencyById: jest.Mock = On(operationService).get(
      method((mock) => mock.getCurrencyById),
    );

    return {
      operationService,
      mockGetCurrencyById,
    };
  };

  const makeSut = () => {
    const { remittanceOrderEventEmitter, mockEmitCreatedEvent } = mockEmitter();

    const {
      mockCreateRemittanceOrderRepository,
      mockGetByIdProviderRepository,
      mockGetByIdSystemRepository,
      providerRepository,
      remittanceOrderRepository,
      systemRepository,
    } = mockRepository();

    const { mockGetCurrencyById, operationService } = mockService();

    const sut = new UseCase(
      logger,
      remittanceOrderRepository,
      systemRepository,
      providerRepository,
      operationService,
      remittanceOrderEventEmitter,
    );

    return {
      sut,
      mockCreateRemittanceOrderRepository,
      mockEmitCreatedEvent,
      mockGetByIdProviderRepository,
      mockGetByIdSystemRepository,
      mockGetCurrencyById,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const {
        sut,
        mockCreateRemittanceOrderRepository,
        mockEmitCreatedEvent,
        mockGetByIdProviderRepository,
        mockGetByIdSystemRepository,
        mockGetCurrencyById,
      } = makeSut();

      const remittanceOrder =
        await RemittanceOrderFactory.create<RemittanceOrderEntity>(
          RemittanceOrderEntity.name,
        );

      const tests = [
        () => sut.execute(null, null, null, null, null, null, null),
        () =>
          sut.execute(remittanceOrder.id, null, null, null, null, null, null),
        () =>
          sut.execute(null, remittanceOrder.side, null, null, null, null, null),
        () =>
          sut.execute(
            null,
            null,
            remittanceOrder.currency,
            null,
            null,
            null,
            null,
          ),
        () =>
          sut.execute(
            null,
            null,
            null,
            remittanceOrder.amount,
            null,
            null,
            null,
          ),
        () =>
          sut.execute(
            null,
            null,
            null,
            null,
            remittanceOrder.system,
            null,
            null,
          ),
        () =>
          sut.execute(
            null,
            null,
            null,
            null,
            null,
            remittanceOrder.provider,
            null,
          ),
        () =>
          sut.execute(null, null, null, null, null, null, remittanceOrder.type),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
        expect(mockEmitCreatedEvent).toHaveBeenCalledTimes(0);
        expect(mockCreateRemittanceOrderRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdProviderRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdSystemRepository).toHaveBeenCalledTimes(0);
        expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should throw SystemNotFoundException if system is not found.', async () => {
      const {
        sut,
        mockCreateRemittanceOrderRepository,
        mockEmitCreatedEvent,
        mockGetByIdProviderRepository,
        mockGetByIdSystemRepository,
        mockGetCurrencyById,
      } = makeSut();

      const remittanceOrder =
        await RemittanceOrderFactory.create<RemittanceOrderEntity>(
          RemittanceOrderEntity.name,
        );

      mockGetByIdSystemRepository.mockResolvedValue(null);

      const test = () =>
        sut.execute(
          remittanceOrder.id,
          remittanceOrder.side,
          remittanceOrder.currency,
          remittanceOrder.amount,
          remittanceOrder.system,
          remittanceOrder.provider,
          remittanceOrder.type,
        );

      await expect(test).rejects.toThrow(SystemNotFoundException);
      expect(mockGetByIdSystemRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdProviderRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw CurrencyNotFoundException if currency is not found.', async () => {
      const {
        sut,
        mockCreateRemittanceOrderRepository,
        mockEmitCreatedEvent,
        mockGetByIdProviderRepository,
        mockGetByIdSystemRepository,
        mockGetCurrencyById,
      } = makeSut();

      const remittanceOrder =
        await RemittanceOrderFactory.create<RemittanceOrderEntity>(
          RemittanceOrderEntity.name,
        );

      mockGetByIdSystemRepository.mockResolvedValue(remittanceOrder.system);
      mockGetCurrencyById.mockResolvedValue(null);

      const test = () =>
        sut.execute(
          remittanceOrder.id,
          remittanceOrder.side,
          remittanceOrder.currency,
          remittanceOrder.amount,
          remittanceOrder.system,
          remittanceOrder.provider,
          remittanceOrder.type,
        );

      await expect(test).rejects.toThrow(CurrencyNotFoundException);
      expect(mockGetByIdSystemRepository).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(1);
      expect(mockCreateRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdProviderRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw ProviderNotFoundException if provider is not found.', async () => {
      const {
        sut,
        mockCreateRemittanceOrderRepository,
        mockEmitCreatedEvent,
        mockGetByIdProviderRepository,
        mockGetByIdSystemRepository,
        mockGetCurrencyById,
      } = makeSut();

      const remittanceOrder =
        await RemittanceOrderFactory.create<RemittanceOrderEntity>(
          RemittanceOrderEntity.name,
        );

      mockGetByIdSystemRepository.mockResolvedValue(remittanceOrder.system);
      mockGetCurrencyById.mockResolvedValue(remittanceOrder.currency);
      mockGetByIdProviderRepository.mockResolvedValue(null);

      const test = () =>
        sut.execute(
          remittanceOrder.id,
          remittanceOrder.side,
          remittanceOrder.currency,
          remittanceOrder.amount,
          remittanceOrder.system,
          remittanceOrder.provider,
          remittanceOrder.type,
        );

      await expect(test).rejects.toThrow(ProviderNotFoundException);
      expect(mockGetByIdSystemRepository).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(1);
      expect(mockGetByIdProviderRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRemittanceOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitCreatedEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should create a new remittance order successfully.', async () => {
      const {
        sut,
        mockCreateRemittanceOrderRepository,
        mockEmitCreatedEvent,
        mockGetByIdProviderRepository,
        mockGetByIdSystemRepository,
        mockGetCurrencyById,
      } = makeSut();

      const remittanceOrder =
        await RemittanceOrderFactory.create<RemittanceOrderEntity>(
          RemittanceOrderEntity.name,
        );

      mockGetByIdSystemRepository.mockResolvedValue(remittanceOrder.system);
      mockGetCurrencyById.mockResolvedValue(remittanceOrder.currency);
      mockGetByIdProviderRepository.mockResolvedValue(remittanceOrder.provider);

      const test = await sut.execute(
        remittanceOrder.id,
        remittanceOrder.side,
        remittanceOrder.currency,
        remittanceOrder.amount,
        remittanceOrder.system,
        remittanceOrder.provider,
        remittanceOrder.type,
      );

      expect(test).toBeDefined();
      expect(mockGetByIdSystemRepository).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(1);
      expect(mockGetByIdProviderRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRemittanceOrderRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitCreatedEvent).toHaveBeenCalledTimes(1);
    });
  });
});
