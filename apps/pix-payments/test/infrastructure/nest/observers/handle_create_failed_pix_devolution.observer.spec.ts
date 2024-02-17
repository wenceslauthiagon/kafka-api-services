import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { OperationEntity } from '@zro/operations/domain';
import {
  PixDepositRepository,
  PixDevolutionRepository,
  PixDevolutionEntity,
  PixDevolutionState,
  PixDepositState,
} from '@zro/pix-payments/domain';
import {
  CreateFailedPixDevolutionNestObserver as Observer,
  PixDepositDatabaseRepository,
  PixDepositModel,
  PixDevolutionDatabaseRepository,
  PixDevolutionModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  PixDevolutionEventType,
  PixDevolutionEventEmitterControllerInterface,
  HandleCreateFailedPixDevolutionEventRequest,
} from '@zro/pix-payments/interface';
import {
  PixDevolutionFactory,
  PixDepositFactory,
} from '@zro/test/pix-payments/config';

describe('CreateFailedPixDevolutionNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let pixDevolutionRepository: PixDevolutionRepository;
  let depositRepository: PixDepositRepository;

  const eventEmitter: PixDevolutionEventEmitterControllerInterface =
    createMock<PixDevolutionEventEmitterControllerInterface>();
  const mockEmitDevolutionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitDevolutionEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<Observer>(Observer);
    pixDevolutionRepository = new PixDevolutionDatabaseRepository();
    depositRepository = new PixDepositDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create pix devolution when missing params', async () => {
      const message: HandleCreateFailedPixDevolutionEventRequest = {
        id: null,
        state: null,
        pixDepositId: null,
        userId: null,
        walletId: null,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixDevolutionRepository,
          depositRepository,
          eventEmitter,
          logger,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create pix devolution if it already exists', async () => {
      const pixDevolution =
        await PixDevolutionFactory.create<PixDevolutionModel>(
          PixDevolutionModel.name,
        );

      const message: HandleCreateFailedPixDevolutionEventRequest = {
        id: pixDevolution.id,
        state: pixDevolution.state,
        pixDepositId: faker.datatype.uuid(),
        userId: pixDevolution.userId,
        walletId: pixDevolution.walletId,
      };

      await controller.execute(
        message,
        pixDevolutionRepository,
        depositRepository,
        eventEmitter,
        logger,
      );

      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should create pix devolution successfully', async () => {
      const pixDeposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        { state: PixDepositState.ERROR },
      );

      const pixDevolution =
        await PixDevolutionFactory.create<PixDevolutionEntity>(
          PixDevolutionEntity.name,
          {
            state: PixDevolutionState.PENDING,
            operation: new OperationEntity({ id: pixDeposit.operationId }),
          },
        );

      const message: HandleCreateFailedPixDevolutionEventRequest = {
        id: pixDevolution.id,
        state: pixDevolution.state,
        pixDepositId: pixDeposit.id,
        userId: pixDeposit.userId,
        walletId: pixDeposit.walletId,
      };

      await controller.execute(
        message,
        pixDevolutionRepository,
        depositRepository,
        eventEmitter,
        logger,
      );

      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitDevolutionEvent.mock.calls[0][0]).toBe(
        PixDevolutionEventType.PENDING_FAILED,
      );
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
