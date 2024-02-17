import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { BankingTedRepository, BankingTedState } from '@zro/banking/domain';
import {
  HandlePendingFailedBankingTedEventUseCase as UseCase,
  BankingTedEventEmitter,
  BankingTedNotFoundException,
  OperationService,
} from '@zro/banking/application';
import {
  BankingTedDatabaseRepository,
  BankingTedModel,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { BankingTedFactory } from '@zro/test/banking/config';

describe('HandlePendingFailedBankingTedEventUseCase', () => {
  let module: TestingModule;
  let bankingTedRepository: BankingTedRepository;

  const eventEmitter: BankingTedEventEmitter =
    createMock<BankingTedEventEmitter>();
  const mockFailedEventEmitter: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.failedBankingTed),
  );

  const operationService: OperationService = createMock<OperationService>();
  const mockRevertOperation: jest.Mock = On(operationService).get(
    method((mock) => mock.revertOperation),
  );
  const mockGetOperation: jest.Mock = On(operationService).get(
    method((mock) => mock.getOperationById),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    bankingTedRepository = new BankingTedDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should handle failed BankingTed successfully', async () => {
      const bankingTed = await BankingTedFactory.create<BankingTedModel>(
        BankingTedModel.name,
        { state: BankingTedState.PENDING },
      );

      mockGetOperation.mockResolvedValue({});

      const usecase = new UseCase(
        logger,
        bankingTedRepository,
        eventEmitter,
        operationService,
      );
      const result = await usecase.execute(bankingTed.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(bankingTed.id);
      expect(result.state).toBe(BankingTedState.FAILED);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockGetOperation).toHaveBeenCalledTimes(1);
      expect(mockRevertOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not handle failed if incorrect state', async () => {
      const bankingTed = await BankingTedFactory.create<BankingTedModel>(
        BankingTedModel.name,
        { state: BankingTedState.FAILED },
      );

      const usecase = new UseCase(
        logger,
        bankingTedRepository,
        eventEmitter,
        operationService,
      );
      const result = await usecase.execute(bankingTed.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(bankingTed.toDomain());
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if id is null', async () => {
      const usecase = new UseCase(
        logger,
        bankingTedRepository,
        eventEmitter,
        operationService,
      );

      const testScript = () => usecase.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if id is not found', async () => {
      const id = faker.datatype.number({ min: 1, max: 9999 });
      const usecase = new UseCase(
        logger,
        bankingTedRepository,
        eventEmitter,
        operationService,
      );

      const testScript = () => usecase.execute(id);

      await expect(testScript).rejects.toThrow(BankingTedNotFoundException);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
