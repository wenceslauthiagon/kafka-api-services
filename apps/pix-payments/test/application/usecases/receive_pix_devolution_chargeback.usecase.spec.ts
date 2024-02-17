import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  PixDepositRepository,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  ReceivePixDevolutionChargebackUseCase as UseCase,
  OperationService,
  PixDevolutionEventEmitter,
  PixDevolutionInvalidStateException,
  PixDevolutionNotFoundException,
} from '@zro/pix-payments/application';
import {
  PixDepositDatabaseRepository,
  PixDevolutionDatabaseRepository,
  PixDevolutionModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixDevolutionFactory } from '@zro/test/pix-payments/config';

describe('ReceivePixDevolutionChargebackUseCase', () => {
  let module: TestingModule;
  let devolutionRepository: PixDevolutionRepository;
  let depositRepository: PixDepositRepository;

  const eventEmitter: PixDevolutionEventEmitter =
    createMock<PixDevolutionEventEmitter>();
  const mockFailedEventEmitter: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.failedDevolution),
  );

  const operationService: OperationService = createMock<OperationService>();
  const mockRevertOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.revertOperation),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    devolutionRepository = new PixDevolutionDatabaseRepository();
    depositRepository = new PixDepositDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should create PixDevolution chargeback successfully', async () => {
      const devolution = await PixDevolutionFactory.create<PixDevolutionModel>(
        PixDevolutionModel.name,
        { state: PixDevolutionState.WAITING },
      );

      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        operationService,
      );
      const result = await usecase.execute(devolution.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(devolution.id);
      expect(result.state).toBe(PixDevolutionState.FAILED);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should create PixDevolution chargeback if state is failed', async () => {
      const devolution = await PixDevolutionFactory.create<PixDevolutionModel>(
        PixDevolutionModel.name,
        { state: PixDevolutionState.FAILED },
      );

      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        operationService,
      );
      const result = await usecase.execute(devolution.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(devolution.id);
      expect(result.state).toBe(PixDevolutionState.FAILED);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not create PixDevolution chargeback if incorrect state', async () => {
      const devolution = await PixDevolutionFactory.create<PixDevolutionModel>(
        PixDevolutionModel.name,
        { state: PixDevolutionState.CONFIRMED },
      );

      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        operationService,
      );
      const testScript = () => usecase.execute(devolution.id);

      await expect(testScript).rejects.toThrow(
        PixDevolutionInvalidStateException,
      );
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not revert if id is null', async () => {
      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        operationService,
      );

      const testScript = () => usecase.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not revert if id is not found', async () => {
      const usecase = new UseCase(
        logger,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        operationService,
      );

      const testScript = () => usecase.execute(uuidV4());

      await expect(testScript).rejects.toThrow(PixDevolutionNotFoundException);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
