import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  PixDepositRepository,
  PixDepositState,
  WarningPixDevolutionState,
  WarningPixDepositRepository,
  WarningPixDepositState,
  WarningPixDevolutionRepository,
} from '@zro/pix-payments/domain';
import { OperationEntity, OperationState } from '@zro/operations/domain';
import {
  CreateWarningPixDevolutionRequest,
  PixDepositEventEmitterControllerInterface,
  PixDepositEventType,
  WarningPixDevolutionEventEmitterControllerInterface,
  WarningPixDevolutionEventType,
} from '@zro/pix-payments/interface';
import {
  CreateWarningPixDevolutionMicroserviceController as Controller,
  WarningPixDepositDatabaseRepository,
  PixDepositDatabaseRepository,
  WarningPixDepositModel,
  PixDepositModel,
  WarningPixDevolutionDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  PixDepositFactory,
  WarningPixDepositFactory,
} from '@zro/test/pix-payments/config';
import { OperationFactory } from '@zro/test/operations/config';

describe('CreateWarningPixDevolutionMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixDepositRepository: PixDepositRepository;
  let warningPixDepositRepository: WarningPixDepositRepository;
  let warningPixDevolutionRepository: WarningPixDevolutionRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  const warningPixDevolutionEventEmitter: WarningPixDevolutionEventEmitterControllerInterface =
    createMock<WarningPixDevolutionEventEmitterControllerInterface>();
  const mockWarningPixDevolutionEvent: jest.Mock = On(
    warningPixDevolutionEventEmitter,
  ).get(method((mock) => mock.emitDevolutionEvent));

  const pixDepositEventEmitter: PixDepositEventEmitterControllerInterface =
    createMock<PixDepositEventEmitterControllerInterface>();
  const mockPixDepositEvent: jest.Mock = On(pixDepositEventEmitter).get(
    method((mock) => mock.emitDepositEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    pixDepositRepository = new PixDepositDatabaseRepository();
    warningPixDepositRepository = new WarningPixDepositDatabaseRepository();
    warningPixDevolutionRepository =
      new WarningPixDevolutionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should create successfully', async () => {
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { state: OperationState.PENDING },
      );
      const pixDeposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        { state: PixDepositState.WAITING, operationId: operation.id },
      );

      await WarningPixDepositFactory.create<WarningPixDepositModel>(
        WarningPixDepositModel.name,
        { state: WarningPixDepositState.CREATED, operationId: operation.id },
      );

      const message: CreateWarningPixDevolutionRequest = {
        operationId: pixDeposit.operationId,
        userId: pixDeposit.userId,
      };

      const result = await controller.execute(
        pixDepositRepository,
        warningPixDepositRepository,
        warningPixDevolutionRepository,
        pixDepositEventEmitter,
        warningPixDevolutionEventEmitter,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.value.id).toBeDefined();
      expect(result.value.state).toBe(WarningPixDevolutionState.PENDING);
      expect(mockWarningPixDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockWarningPixDevolutionEvent.mock.calls[0][0]).toBe(
        WarningPixDevolutionEventType.CREATED,
      );
      expect(mockPixDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockPixDepositEvent.mock.calls[0][0]).toBe(
        PixDepositEventType.BLOCKED,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not approve pix deposit if missing params', async () => {
      const message: CreateWarningPixDevolutionRequest = {
        operationId: null,
        userId: null,
      };

      const testScript = () =>
        controller.execute(
          pixDepositRepository,
          warningPixDepositRepository,
          warningPixDevolutionRepository,
          pixDepositEventEmitter,
          warningPixDevolutionEventEmitter,
          logger,
          message,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockWarningPixDevolutionEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
