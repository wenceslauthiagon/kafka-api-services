import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  PixDepositRepository,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  ReceivePixDevolutionChargebackMicroserviceController as Controller,
  PixDevolutionDatabaseRepository,
  PixDevolutionModel,
  OperationServiceKafka,
  PixDepositDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import { PixDevolutionFactory } from '@zro/test/pix-payments/config';
import {
  PixDevolutionEventEmitterControllerInterface,
  PixDevolutionEventType,
  ReceivePixDevolutionChargebackRequest,
} from '@zro/pix-payments/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('ReceivePixDevolutionChargebackMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let devolutionRepository: PixDevolutionRepository;
  let depositRepository: PixDepositRepository;

  const eventEmitter: PixDevolutionEventEmitterControllerInterface =
    createMock<PixDevolutionEventEmitterControllerInterface>();
  const mockEmitDevolutionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitDevolutionEvent),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockRevertOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.revertOperation),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    devolutionRepository = new PixDevolutionDatabaseRepository();
    depositRepository = new PixDepositDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should create pixDevolution chargeback successfully', async () => {
      const { id } = await PixDevolutionFactory.create<PixDevolutionModel>(
        PixDevolutionModel.name,
        { state: PixDevolutionState.WAITING },
      );

      const message: ReceivePixDevolutionChargebackRequest = {
        id,
        chargebackReason: 'REASON',
      };

      const result = await controller.execute(
        message,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        operationService,
        logger,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.id).toBe(id);
      expect(result.value.state).toBe(PixDevolutionState.FAILED);
      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitDevolutionEvent.mock.calls[0][0]).toBe(
        PixDevolutionEventType.FAILED,
      );
      expect(mockRevertOperationService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not create pixDevolution chargeback if state is failed', async () => {
      const { id, state } =
        await PixDevolutionFactory.create<PixDevolutionModel>(
          PixDevolutionModel.name,
          {
            state: PixDevolutionState.FAILED,
          },
        );

      const message: ReceivePixDevolutionChargebackRequest = {
        id,
      };

      const result = await controller.execute(
        message,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        operationService,
        logger,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.id).toBe(id);
      expect(result.value.state).toBe(state);
      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
