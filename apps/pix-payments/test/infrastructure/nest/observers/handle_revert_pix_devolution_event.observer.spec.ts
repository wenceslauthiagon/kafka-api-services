import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  PixDepositRepository,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  RevertPixDevolutionNestObserver as Observer,
  PixDevolutionDatabaseRepository,
  PixDevolutionModel,
  OperationServiceKafka,
  PixDepositDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  HandleRevertPixDevolutionEventRequest,
  PixDevolutionEventEmitterControllerInterface,
  PixDevolutionEventType,
} from '@zro/pix-payments/interface';
import { PixDevolutionFactory } from '@zro/test/pix-payments/config';

describe('RevertPixDevolutionNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
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

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Observer>(Observer);
    devolutionRepository = new PixDevolutionDatabaseRepository();
    depositRepository = new PixDepositDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should handle revert pixDevolution successfully', async () => {
      const { id, userId, walletId, state } =
        await PixDevolutionFactory.create<PixDevolutionModel>(
          PixDevolutionModel.name,
          { state: PixDevolutionState.PENDING },
        );

      const message: HandleRevertPixDevolutionEventRequest = {
        id,
        userId,
        walletId,
        state,
      };

      await controller.execute(
        message,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        operationService,
        logger,
      );

      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitDevolutionEvent.mock.calls[0][0]).toBe(
        PixDevolutionEventType.FAILED,
      );
      expect(mockRevertOperationService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not revert failed if incorrect state', async () => {
      const { id, userId, walletId, state } =
        await PixDevolutionFactory.create<PixDevolutionModel>(
          PixDevolutionModel.name,
          { state: PixDevolutionState.ERROR },
        );

      const message: HandleRevertPixDevolutionEventRequest = {
        id,
        userId,
        walletId,
        state,
      };

      await controller.execute(
        message,
        devolutionRepository,
        depositRepository,
        eventEmitter,
        operationService,
        logger,
      );

      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
