import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  CreateRemittanceExposureRuleUseCase as UseCase,
  RemittanceExposureRuleEventEmitter,
  OperationService,
  RemittanceExposureRuleAlreadyExistsException,
} from '@zro/otc/application';
import {
  RemittanceExposureRuleEntity,
  RemittanceExposureRuleRepository,
} from '@zro/otc/domain';
import { RemittanceExposureRuleFactory } from '@zro/test/otc/config';
import { CurrencyNotFoundException } from '@zro/operations/application';

describe('CreateRemittanceExposureRuleUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const remittanceExposureRuleEventEmitter: RemittanceExposureRuleEventEmitter =
      createMock<RemittanceExposureRuleEventEmitter>();
    const mockEmitCreatedEvent: jest.Mock = On(
      remittanceExposureRuleEventEmitter,
    ).get(method((mock) => mock.createdRemittanceExposureRule));

    return {
      remittanceExposureRuleEventEmitter,
      mockEmitCreatedEvent,
    };
  };

  const mockRepository = () => {
    const remittanceExposureRuleRepository: RemittanceExposureRuleRepository =
      createMock<RemittanceExposureRuleRepository>();
    const mockGetByIdRemittanceExposureRuleRepository: jest.Mock = On(
      remittanceExposureRuleRepository,
    ).get(method((mock) => mock.getById));
    const mockGetByCurrencyRemittanceExposureRuleRepository: jest.Mock = On(
      remittanceExposureRuleRepository,
    ).get(method((mock) => mock.getByCurrency));

    return {
      remittanceExposureRuleRepository,
      mockGetByIdRemittanceExposureRuleRepository,
      mockGetByCurrencyRemittanceExposureRuleRepository,
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
    const { remittanceExposureRuleEventEmitter, mockEmitCreatedEvent } =
      mockEmitter();

    const {
      remittanceExposureRuleRepository,
      mockGetByIdRemittanceExposureRuleRepository,
      mockGetByCurrencyRemittanceExposureRuleRepository,
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
      mockEmitCreatedEvent,
      mockGetByIdRemittanceExposureRuleRepository,
      mockGetCurrencyBySymbol,
      mockGetByCurrencyRemittanceExposureRuleRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const {
        sut,
        mockEmitCreatedEvent,
        mockGetByIdRemittanceExposureRuleRepository,
        mockGetCurrencyBySymbol,
        mockGetByCurrencyRemittanceExposureRuleRepository,
      } = makeSut();

      const remittanceExposureRule =
        await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
          RemittanceExposureRuleEntity.name,
        );

      const tests = [
        () => sut.execute({ ...remittanceExposureRule, id: null }),
        () => sut.execute({ ...remittanceExposureRule, currency: null }),
        () => sut.execute({ ...remittanceExposureRule, amount: null }),
        () => sut.execute({ ...remittanceExposureRule, seconds: null }),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
        expect(mockEmitCreatedEvent).toHaveBeenCalledTimes(0);
        expect(
          mockGetByIdRemittanceExposureRuleRepository,
        ).toHaveBeenCalledTimes(0);
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
        expect(
          mockGetByCurrencyRemittanceExposureRuleRepository,
        ).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should return if remittance exposure rule ID already exists.', async () => {
      const {
        sut,
        mockEmitCreatedEvent,
        mockGetByIdRemittanceExposureRuleRepository,
        mockGetCurrencyBySymbol,
        mockGetByCurrencyRemittanceExposureRuleRepository,
      } = makeSut();

      const remittanceExposureRule =
        await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
          RemittanceExposureRuleEntity.name,
        );

      mockGetByIdRemittanceExposureRuleRepository.mockResolvedValue(
        remittanceExposureRule,
      );

      const test = await sut.execute(remittanceExposureRule);

      expect(test).toBeDefined();
      expect(mockEmitCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRemittanceExposureRuleRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(
        mockGetByCurrencyRemittanceExposureRuleRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw CurrencyNotFoundException if currency is not found.', async () => {
      const {
        sut,
        mockEmitCreatedEvent,
        mockGetByIdRemittanceExposureRuleRepository,
        mockGetCurrencyBySymbol,
        mockGetByCurrencyRemittanceExposureRuleRepository,
      } = makeSut();

      const remittanceExposureRule =
        await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
          RemittanceExposureRuleEntity.name,
        );

      mockGetByIdRemittanceExposureRuleRepository.mockResolvedValue(null);
      mockGetCurrencyBySymbol.mockResolvedValue(null);

      const test = () => sut.execute(remittanceExposureRule);

      await expect(test).rejects.toThrow(CurrencyNotFoundException);
      expect(mockEmitCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRemittanceExposureRuleRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(
        mockGetByCurrencyRemittanceExposureRuleRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw RemittanceExposureRuleAlreadyExistsException if remittance exposure rule for provided currency already exists.', async () => {
      const {
        sut,
        mockEmitCreatedEvent,
        mockGetByIdRemittanceExposureRuleRepository,
        mockGetCurrencyBySymbol,
        mockGetByCurrencyRemittanceExposureRuleRepository,
      } = makeSut();

      const remittanceExposureRule =
        await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
          RemittanceExposureRuleEntity.name,
        );

      mockGetCurrencyBySymbol.mockResolvedValue(
        remittanceExposureRule.currency,
      );
      mockGetByIdRemittanceExposureRuleRepository.mockResolvedValue(null);
      mockGetByCurrencyRemittanceExposureRuleRepository.mockResolvedValue(
        remittanceExposureRule,
      );

      const test = () => sut.execute(remittanceExposureRule);

      await expect(test).rejects.toThrow(
        RemittanceExposureRuleAlreadyExistsException,
      );
      expect(mockEmitCreatedEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdRemittanceExposureRuleRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(
        mockGetByCurrencyRemittanceExposureRuleRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should create a new remittance exposure rule successfully.', async () => {
      const {
        sut,
        mockEmitCreatedEvent,
        mockGetByIdRemittanceExposureRuleRepository,
        mockGetCurrencyBySymbol,
        mockGetByCurrencyRemittanceExposureRuleRepository,
      } = makeSut();

      const remittanceExposureRule =
        await RemittanceExposureRuleFactory.create<RemittanceExposureRuleEntity>(
          RemittanceExposureRuleEntity.name,
        );

      mockGetCurrencyBySymbol.mockResolvedValue(
        remittanceExposureRule.currency,
      );
      mockGetByIdRemittanceExposureRuleRepository.mockResolvedValue(null);
      mockGetByCurrencyRemittanceExposureRuleRepository.mockResolvedValue(null);

      const test = await sut.execute(remittanceExposureRule);

      expect(test).toBeDefined();
      expect(mockEmitCreatedEvent).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRemittanceExposureRuleRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(
        mockGetByCurrencyRemittanceExposureRuleRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
