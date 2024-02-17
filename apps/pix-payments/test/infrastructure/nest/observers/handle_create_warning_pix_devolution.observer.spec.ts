import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  PixDepositRepository,
  WarningPixDevolutionRepository,
  WarningPixDepositRepository,
  WarningPixDevolutionEntity,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  CreateWarningPixDevolutionNestObserver as Observer,
  PixDepositDatabaseRepository,
  PixDepositModel,
  WarningPixDepositDatabaseRepository,
  WarningPixDepositModel,
  WarningPixDevolutionDatabaseRepository,
  WarningPixDevolutionModel,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCreateWarningPixDevolutionEventRequest,
  PixDevolutionEventType,
  WarningPixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  PixDepositFactory,
  WarningPixDevolutionFactory,
  WarningPixDepositFactory,
} from '@zro/test/pix-payments/config';

describe('CreateWarningPixDevolutionNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let warningPixDevolutionRepository: WarningPixDevolutionRepository;
  let warningPixDepositRepository: WarningPixDepositRepository;
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
    warningPixDepositRepository = new WarningPixDepositDatabaseRepository();
    depositRepository = new PixDepositDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create warning pix devolution with missing params', async () => {
      const message: HandleCreateWarningPixDevolutionEventRequest = {
        id: null,
        state: null,
        warningPixId: null,
        userId: null,
      };

      const testScript = () =>
        controller.execute(
          message,
          warningPixDevolutionRepository,
          warningPixDepositRepository,
          depositRepository,
          eventEmitter,
          logger,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create warning pix devolution if pix devolution already exists', async () => {
      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionModel>(
          WarningPixDevolutionModel.name,
        );

      const message: HandleCreateWarningPixDevolutionEventRequest = {
        id: warningPixDevolution.id,
        state: warningPixDevolution.state,
        warningPixId: faker.datatype.uuid(),
        userId: warningPixDevolution.userId,
      };

      await controller.execute(
        message,
        warningPixDevolutionRepository,
        warningPixDepositRepository,
        depositRepository,
        eventEmitter,
        logger,
      );

      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should create warning pix devolution devolution successfully', async () => {
      const warningPixDeposit =
        await WarningPixDepositFactory.create<WarningPixDepositModel>(
          WarningPixDepositModel.name,
        );

      const deposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        {
          operationId: warningPixDeposit.operationId,
        },
      );

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            state: WarningPixDevolutionState.PENDING,
            operation: deposit.operation,
          },
        );

      const message: HandleCreateWarningPixDevolutionEventRequest = {
        id: warningPixDevolution.id,
        state: warningPixDevolution.state,
        warningPixId: warningPixDeposit.id,
        userId: deposit.userId,
      };

      await controller.execute(
        message,
        warningPixDevolutionRepository,
        warningPixDepositRepository,
        depositRepository,
        eventEmitter,
        logger,
      );

      expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitDevolutionEvent.mock.calls[0][0]).toBe(
        PixDevolutionEventType.PENDING,
      );
    });
  });
});
