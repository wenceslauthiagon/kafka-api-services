import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  PixDepositRepository,
  PixDepositState,
  WarningPixDepositRepository,
  WarningPixDepositState,
} from '@zro/pix-payments/domain';
import { OperationEntity, OperationState } from '@zro/operations/domain';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  BlockPixDepositMicroserviceController as Controller,
  WarningPixDepositDatabaseRepository,
  OperationServiceKafka,
  PixDepositDatabaseRepository,
  WarningPixDepositModel,
  PixDepositModel,
} from '@zro/pix-payments/infrastructure';
import {
  BlockPixDepositRequest,
  PixDepositEventEmitterControllerInterface,
  PixDepositEventType,
  WarningPixDevolutionEventEmitterControllerInterface,
  WarningPixDevolutionEventType,
} from '@zro/pix-payments/interface';
import {
  PixDepositFactory,
  WarningPixDepositFactory,
} from '@zro/test/pix-payments/config';
import { OperationFactory } from '@zro/test/operations/config';

describe('BlockPixDepositMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixDepositRepository: PixDepositRepository;
  let warningPixDepositRepository: WarningPixDepositRepository;

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();

  const mockGetByIdOperation: jest.Mock = On(operationService).get(
    method((mock) => mock.getOperationById),
  );

  const pixDepositEventEmitter: PixDepositEventEmitterControllerInterface =
    createMock<PixDepositEventEmitterControllerInterface>();
  const mockPixDepositEvent: jest.Mock = On(pixDepositEventEmitter).get(
    method((mock) => mock.emitDepositEvent),
  );

  const warningPixDevolutionEventEmitter: WarningPixDevolutionEventEmitterControllerInterface =
    createMock<WarningPixDevolutionEventEmitterControllerInterface>();
  const mockWarningPixDevolutionEvent: jest.Mock = On(
    warningPixDevolutionEventEmitter,
  ).get(method((mock) => mock.emitDevolutionEvent));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    pixDepositRepository = new PixDepositDatabaseRepository();
    warningPixDepositRepository = new WarningPixDepositDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should block pix deposit successfully', async () => {
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { state: OperationState.PENDING },
      );

      mockGetByIdOperation.mockResolvedValue(operation);

      const pixDeposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        { state: PixDepositState.WAITING, operationId: operation.id },
      );

      const warningPixDeposit =
        await WarningPixDepositFactory.create<WarningPixDepositModel>(
          WarningPixDepositModel.name,
          { state: WarningPixDepositState.CREATED, operationId: operation.id },
        );

      const message: BlockPixDepositRequest = {
        operationId: pixDeposit.operationId,
      };

      const result = await controller.execute(
        logger,
        pixDepositRepository,
        warningPixDepositRepository,
        operationService,
        pixDepositEventEmitter,
        warningPixDevolutionEventEmitter,
        message,
        ctx,
      );

      expect(mockPixDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockGetByIdOperation).toHaveBeenCalledTimes(1);
      expect(mockWarningPixDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.operation.id).toBe(pixDeposit.operationId);
      expect(result.value.operation.id).toBe(warningPixDeposit.operationId);
      expect(result.value.state).toBe(PixDepositState.BLOCKED);
      expect(mockPixDepositEvent.mock.calls[0][0]).toBe(
        PixDepositEventType.BLOCKED,
      );
      expect(mockWarningPixDevolutionEvent.mock.calls[0][0]).toBe(
        WarningPixDevolutionEventType.CREATED,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not block pix deposit if missing params', async () => {
      const message: BlockPixDepositRequest = {
        operationId: null,
      };

      const testScript = () =>
        controller.execute(
          logger,
          pixDepositRepository,
          warningPixDepositRepository,

          operationService,
          pixDepositEventEmitter,
          warningPixDevolutionEventEmitter,
          message,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByIdOperation).toHaveBeenCalledTimes(0);
      expect(mockWarningPixDevolutionEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
