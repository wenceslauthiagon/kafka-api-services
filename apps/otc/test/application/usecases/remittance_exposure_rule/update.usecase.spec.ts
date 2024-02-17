import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  UpdateRemittanceExposureRuleUseCase as UseCase,
  RemittanceExposureRuleEventEmitter,
  OperationService,
  RemittanceExposureRuleNotFoundException,
  RemittanceExposureRuleAlreadyExistsException,
} from '@zro/otc/application';
import {
  RemittanceExposureRuleEntity,
  RemittanceExposureRuleRepository,
} from '@zro/otc/domain';
import { RemittanceExposureRuleFactory } from '@zro/test/otc/config';
import { CurrencyNotFoundException } from '@zro/operations/application';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CurrencyEntity } from '@zro/operations/domain';

describe('UpdateRemittanceExposureRuleUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const remittanceExposureRuleEventEmitter: RemittanceExposureRuleEventEmitter =
      createMock<RemittanceExposureRuleEventEmitter>();
    const mockEmitUpdatedEvent: jest.Mock = On(
      remittanceExposureRuleEventEmitter,
    ).get(method((mock) => mock.updatedRemittanceExposureRule));

    return {
      remittanceExposureRuleEventEmitter,
      mockEmitUpdatedEvent,
    };
  };

  const mockRepository = () => {
    const remittanceExposureRuleRepository: RemittanceExposureRuleRepository =
      createMock<RemittanceExposureRuleRepository>();
    const mockGetByIdRemittanceExposureRuleRepository: jest.Mock = On(
      remittanceExposureRuleRepository,
    ).get(method((mock) => mock.getById));
    const mockGetBySymbolRemittanceExposureRuleRepository: jest.Mock = On(
      remittanceExposureRuleRepository,
    ).get(method((mock) => mock.getByCurrency));

    return {
      remittanceExposureRuleRepository,
      mockGetByIdRemittanceExposureRuleRepository,
      mockGetBySymbolRemittanceExposureRuleRepository,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetCurrencyBySymbol: jest.Mock = On(operationService).get(
      method((mock) => mock.getCurrencyBySymbol),
    );

    return {
      operationService,
      mockGetCurrencyBySymbol,
    };
  };

  const makeSut = () => {
    const { remittanceExposureRuleEventEmitter, mockEmitUpdatedEvent } =
      mockEmitter();

    const {
      remittanceExposureRuleRepository,
      mockGetByIdRemittanceExposureRuleRepository,
      mockGetBySymbolRemittanceExposureRuleRepository,
    } = mockRepository();

    const { operationService, mockGetCurrencyBySymbol } = mockService();

    const sut = new UseCase(
      logger,
      remittanceExposureRuleRepository,
      operationService,
      remittanceExposureRuleEventEmitter,
    );

    return {
      sut,
      mockEmitUpdatedEvent,
      mockGetByIdRemittanceExposureRuleRepository,
      mockGetCurrencyBySymbol,
      mockGetBySymbolRemittanceExposureRuleRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const {
        sut,
        mockEmitUpdatedEvent,
        mockGetByIdRemittanceExposureRuleRepository,
        mockGetCurrencyBySymbol,
        mockGetBySymbolRemittanceExposureRuleRepository,
      } = makeSut();

      const remittanceExposureRule =
        await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
          RemittanceExposureRuleEntity.name,
          {
            id: null,
          },
        );

      const testScript = () =>
        sut.execute(
          remittanceExposureRule.id,
          remittanceExposureRule.currency,
          remittanceExposureRule.amount,
          remittanceExposureRule.seconds,
        );

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockEmitUpdatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRemittanceExposureRuleRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(
        mockGetBySymbolRemittanceExposureRuleRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw RemittanceExposureRuleNotFoundException if remittance exposure rule do not exist.', async () => {
      const {
        sut,
        mockEmitUpdatedEvent,
        mockGetByIdRemittanceExposureRuleRepository,
        mockGetCurrencyBySymbol,
        mockGetBySymbolRemittanceExposureRuleRepository,
      } = makeSut();

      const remittanceExposureRule =
        await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
          RemittanceExposureRuleEntity.name,
        );

      mockGetByIdRemittanceExposureRuleRepository.mockResolvedValue(null);

      const test = () =>
        sut.execute(
          remittanceExposureRule.id,
          remittanceExposureRule.currency,
          remittanceExposureRule.amount,
          remittanceExposureRule.seconds,
        );

      await expect(test).rejects.toThrow(
        RemittanceExposureRuleNotFoundException,
      );
      expect(mockEmitUpdatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRemittanceExposureRuleRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(
        mockGetBySymbolRemittanceExposureRuleRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw CurrencyNotFoundException if currency is not found.', async () => {
      const {
        sut,
        mockEmitUpdatedEvent,
        mockGetByIdRemittanceExposureRuleRepository,
        mockGetCurrencyBySymbol,
        mockGetBySymbolRemittanceExposureRuleRepository,
      } = makeSut();

      const remittanceExposureRule =
        await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
          RemittanceExposureRuleEntity.name,
        );

      mockGetByIdRemittanceExposureRuleRepository.mockResolvedValue(
        remittanceExposureRule,
      );
      mockGetCurrencyBySymbol.mockResolvedValue(null);

      const test = () =>
        sut.execute(
          remittanceExposureRule.id,
          remittanceExposureRule.currency,
          remittanceExposureRule.amount,
          remittanceExposureRule.seconds,
        );

      await expect(test).rejects.toThrow(CurrencyNotFoundException);
      expect(mockEmitUpdatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRemittanceExposureRuleRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(
        mockGetBySymbolRemittanceExposureRuleRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw RemittanceExposureRuleAlreadyExistsException if rule for new currency already exists.', async () => {
      const {
        sut,
        mockEmitUpdatedEvent,
        mockGetByIdRemittanceExposureRuleRepository,
        mockGetCurrencyBySymbol,
        mockGetBySymbolRemittanceExposureRuleRepository,
      } = makeSut();

      const remittanceExposureRule =
        await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
          RemittanceExposureRuleEntity.name,
        );

      mockGetByIdRemittanceExposureRuleRepository.mockResolvedValue(
        remittanceExposureRule,
      );
      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      mockGetCurrencyBySymbol.mockResolvedValue(currency);
      mockGetBySymbolRemittanceExposureRuleRepository.mockResolvedValue({
        ...remittanceExposureRule,
        currency,
      });

      const test = () =>
        sut.execute(
          remittanceExposureRule.id,
          remittanceExposureRule.currency,
          remittanceExposureRule.amount,
          remittanceExposureRule.seconds,
        );

      await expect(test).rejects.toThrow(
        RemittanceExposureRuleAlreadyExistsException,
      );
      expect(mockEmitUpdatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRemittanceExposureRuleRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(
        mockGetBySymbolRemittanceExposureRuleRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should update a remittance exposure rule with new currency successfully.', async () => {
      const {
        sut,
        mockEmitUpdatedEvent,
        mockGetByIdRemittanceExposureRuleRepository,
        mockGetCurrencyBySymbol,
        mockGetBySymbolRemittanceExposureRuleRepository,
      } = makeSut();

      const remittanceExposureRule =
        await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
          RemittanceExposureRuleEntity.name,
        );

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      mockGetByIdRemittanceExposureRuleRepository.mockResolvedValue(
        remittanceExposureRule,
      );
      mockGetCurrencyBySymbol.mockResolvedValue(currency);
      mockGetBySymbolRemittanceExposureRuleRepository.mockResolvedValue(null);

      const test = await sut.execute(
        remittanceExposureRule.id,
        currency,
        remittanceExposureRule.amount,
        remittanceExposureRule.seconds,
      );

      expect(test).toBeDefined();
      expect(mockEmitUpdatedEvent).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRemittanceExposureRuleRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(
        mockGetBySymbolRemittanceExposureRuleRepository,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should update a remittance exposure rule with same currency successfully.', async () => {
      const {
        sut,
        mockEmitUpdatedEvent,
        mockGetByIdRemittanceExposureRuleRepository,
        mockGetCurrencyBySymbol,
        mockGetBySymbolRemittanceExposureRuleRepository,
      } = makeSut();

      const remittanceExposureRule =
        await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
          RemittanceExposureRuleEntity.name,
        );

      mockGetByIdRemittanceExposureRuleRepository.mockResolvedValue(
        remittanceExposureRule,
      );

      mockGetCurrencyBySymbol.mockResolvedValue(
        remittanceExposureRule.currency,
      );

      const test = await sut.execute(
        remittanceExposureRule.id,
        remittanceExposureRule.currency,
        remittanceExposureRule.amount,
        remittanceExposureRule.seconds,
      );

      expect(test).toBeDefined();
      expect(mockEmitUpdatedEvent).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRemittanceExposureRuleRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(
        mockGetBySymbolRemittanceExposureRuleRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should update a remittance exposure rule without new currency successfully.', async () => {
      const {
        sut,
        mockEmitUpdatedEvent,
        mockGetByIdRemittanceExposureRuleRepository,
        mockGetCurrencyBySymbol,
        mockGetBySymbolRemittanceExposureRuleRepository,
      } = makeSut();

      const remittanceExposureRule =
        await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
          RemittanceExposureRuleEntity.name,
        );

      mockGetByIdRemittanceExposureRuleRepository.mockResolvedValue(
        remittanceExposureRule,
      );

      const test = await sut.execute(
        remittanceExposureRule.id,
        null,
        remittanceExposureRule.amount,
        remittanceExposureRule.seconds,
      );

      expect(test).toBeDefined();
      expect(mockEmitUpdatedEvent).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRemittanceExposureRuleRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(
        mockGetBySymbolRemittanceExposureRuleRepository,
      ).toHaveBeenCalledTimes(0);
    });
  });
});
