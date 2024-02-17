import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  FailedEntity,
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  PixDepositRepository,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  RevertWarningPixDevolutionNestObserver as Observer,
  PixDepositDatabaseRepository,
  WarningPixDevolutionDatabaseRepository,
  WarningPixDevolutionModel,
  PixDepositModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  HandleRevertWarningPixDevolutionEventRequest,
  PixDevolutionEventType,
  WarningPixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  PixDepositFactory,
  WarningPixDevolutionFactory,
} from '@zro/test/pix-payments/config';

describe('PendingWarningPixDevolutionNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let warningPixDevolutionRepository: WarningPixDevolutionRepository;
  let depositRepository: PixDepositRepository;

  const eventEmitter: WarningPixDevolutionEventEmitterControllerInterface =
    createMock<WarningPixDevolutionEventEmitterControllerInterface>();
  const mockEmitDevolutionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitDevolutionEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Observer>(Observer);
    warningPixDevolutionRepository =
      new WarningPixDevolutionDatabaseRepository();
    depositRepository = new PixDepositDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should handle revert WarningPixDevolution successfully', async () => {
      const { operationId } = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
      );

      const { id, userId, state } =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionModel>(
          WarningPixDevolutionModel.name,
          { state: WarningPixDevolutionState.WAITING, operationId },
        );

      const failed = new FailedEntity({
        code: 'test',
        message: 'test',
      });

      const message: HandleRevertWarningPixDevolutionEventRequest = {
        id,
        state,
        userId,
        failed,
      };

      await controller.execute(
        message,
        warningPixDevolutionRepository,
        depositRepository,
        eventEmitter,
        logger,
      );

      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitDevolutionEvent.mock.calls[0][0]).toBe(
        PixDevolutionEventType.FAILED,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not handle revert WarningPixDevolution when state is already failed', async () => {
      const { id, userId, state } =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionModel>(
          WarningPixDevolutionModel.name,
          { state: WarningPixDevolutionState.FAILED },
        );

      const failed = new FailedEntity({
        code: 'test',
        message: 'test',
      });

      const message: HandleRevertWarningPixDevolutionEventRequest = {
        id,
        state,
        userId,
        failed,
      };

      controller.execute(
        message,
        warningPixDevolutionRepository,
        depositRepository,
        eventEmitter,
        logger,
      );

      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not handle revert WarningPixDevolution when missing params', async () => {
      const message: HandleRevertWarningPixDevolutionEventRequest = {
        id: null,
        state: null,
        userId: null,
      };

      const testScript = () =>
        controller.execute(
          message,
          warningPixDevolutionRepository,
          depositRepository,
          eventEmitter,
          logger,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
