import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import { WarningTransactionGateway } from '@zro/compliance/application';
import {
  HandleExpiredWarningTransactionEventRequest,
  HandleWarningTransactionCreatedEventRequest,
  WarningTransactionEventEmitterControllerInterface,
  WarningTransactionEventType,
} from '@zro/compliance/interface';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import {
  ExpiredWarningTransactionNestObserver as Observer,
  WarningTransactionDatabaseRepository,
  WarningTransactionModel,
} from '@zro/compliance/infrastructure';
import { WarningTransactionFactory } from '@zro/test/compliance/config';

describe('ExpiredWarningTransactionNestObserver', () => {
  let module: TestingModule;
  let observer: Observer;
  let warningTransactionRepository: WarningTransactionRepository;

  const eventEmitter: WarningTransactionEventEmitterControllerInterface =
    createMock<WarningTransactionEventEmitterControllerInterface>();
  const mockEmitWarningTransactionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitWarningTransactionEvent),
  );

  const warningTransactionGateway: WarningTransactionGateway =
    createMock<WarningTransactionGateway>();
  const mockUpdateWarningTransactionGateway: jest.Mock = On(
    warningTransactionGateway,
  ).get(method((mock) => mock.updateWarningTransactionStatusToClosed));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    observer = module.get<Observer>(Observer);
    warningTransactionRepository = new WarningTransactionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should handle update warning transaction status to closed successfully', async () => {
      const { id, status } =
        await WarningTransactionFactory.create<WarningTransactionModel>(
          WarningTransactionModel.name,
          { status: WarningTransactionStatus.CLOSED },
        );

      const message: HandleExpiredWarningTransactionEventRequest = {
        id,
        status,
      };

      await observer.execute(
        message,
        warningTransactionRepository,
        warningTransactionGateway,
        eventEmitter,
        logger,
      );

      expect(mockEmitWarningTransactionEvent.mock.calls[0][0]).toBe(
        WarningTransactionEventType.CLOSED,
      );
      expect(mockEmitWarningTransactionEvent).toHaveBeenCalledTimes(1);
      expect(mockUpdateWarningTransactionGateway).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not handle if missing params', async () => {
      const message: HandleExpiredWarningTransactionEventRequest = {
        id: faker.datatype.uuid(),
        status: null,
      };

      const testScript = () =>
        observer.execute(
          message,
          warningTransactionRepository,
          warningTransactionGateway,
          eventEmitter,
          logger,
        );

      expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockEmitWarningTransactionEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningTransactionGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not handle update warning transaction if status is not CLOSED', async () => {
      const { id, status } =
        await WarningTransactionFactory.create<WarningTransactionModel>(
          WarningTransactionModel.name,
          { status: WarningTransactionStatus.SENT },
        );

      const message: HandleWarningTransactionCreatedEventRequest = {
        id,
        status,
      };

      await observer.execute(
        message,
        warningTransactionRepository,
        warningTransactionGateway,
        eventEmitter,
        logger,
      );

      expect(mockEmitWarningTransactionEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningTransactionGateway).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
