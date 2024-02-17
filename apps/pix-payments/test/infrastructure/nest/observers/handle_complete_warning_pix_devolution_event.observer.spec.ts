import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger } from '@zro/common';
import {
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  CompleteWarningPixDevolutionNestObserver as Observer,
  WarningPixDevolutionDatabaseRepository,
  WarningPixDevolutionModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { WarningPixDevolutionFactory } from '@zro/test/pix-payments/config';
import {
  HandleCompleteWarningPixDevolutionEventRequest,
  WarningPixDevolutionEventEmitterControllerInterface,
  WarningPixDevolutionEventType,
} from '@zro/pix-payments/interface';

describe('CompletePixDevolutionNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let warningPixDevolutionRepository: WarningPixDevolutionRepository;

  const eventEmitter: WarningPixDevolutionEventEmitterControllerInterface =
    createMock<WarningPixDevolutionEventEmitterControllerInterface>();
  const mockEmitEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitDevolutionEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<Observer>(Observer);
    warningPixDevolutionRepository =
      new WarningPixDevolutionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should handle complete warningPixDevolution successfully', async () => {
      const { id, userId, state } =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionModel>(
          WarningPixDevolutionModel.name,
          {
            state: WarningPixDevolutionState.WAITING,
          },
        );

      const message: HandleCompleteWarningPixDevolutionEventRequest = {
        id,
        userId,
        state,
      };

      await controller.execute(
        message,
        warningPixDevolutionRepository,
        eventEmitter,
        logger,
        ctx,
      );

      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent.mock.calls[0][0]).toBe(
        WarningPixDevolutionEventType.CONFIRMED,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not handle complete if incorrect state', async () => {
      const { id, userId, state } =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionModel>(
          WarningPixDevolutionModel.name,
          {
            state: WarningPixDevolutionState.CONFIRMED,
          },
        );

      const message: HandleCompleteWarningPixDevolutionEventRequest = {
        id,
        userId,
        state,
      };

      await controller.execute(
        message,
        warningPixDevolutionRepository,
        eventEmitter,
        logger,
        ctx,
      );

      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
