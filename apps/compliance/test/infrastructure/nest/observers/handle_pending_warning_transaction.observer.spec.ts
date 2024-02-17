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
  HandleWarningTransactionCreatedEventRequest,
  WarningTransactionEventEmitterControllerInterface,
  WarningTransactionEventType,
} from '@zro/compliance/interface';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import {
  PendingWarningTransactionNestObserver as Observer,
  WarningTransactionDatabaseRepository,
  WarningTransactionModel,
} from '@zro/compliance/infrastructure';
import { WarningTransactionFactory } from '@zro/test/compliance/config';
import { KafkaContext } from '@nestjs/microservices';

describe('PendingWarningTransactionNestObserver', () => {
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
  const mockCreateWarningTransactionGateway: jest.Mock = On(
    warningTransactionGateway,
  ).get(method((mock) => mock.createWarningTransaction));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    observer = module.get<Observer>(Observer);
    warningTransactionRepository = new WarningTransactionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('handleCreateWarningTransactionEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle create warning transaction successfully', async () => {
        const { id, status } =
          await WarningTransactionFactory.create<WarningTransactionModel>(
            WarningTransactionModel.name,
            { status: WarningTransactionStatus.PENDING },
          );

        mockCreateWarningTransactionGateway.mockResolvedValueOnce({
          issueId: faker.datatype.number({ min: 1, max: 99999 }),
          key: 'test',
        });

        const message: HandleWarningTransactionCreatedEventRequest = {
          id,
          status,
        };

        await observer.handleWarningTransactionCreatedEventViaJira(
          message,
          warningTransactionRepository,
          eventEmitter,
          logger,
          warningTransactionGateway,
          ctx,
        );

        expect(mockEmitWarningTransactionEvent.mock.calls[0][0]).toBe(
          WarningTransactionEventType.SENT,
        );
        expect(mockEmitWarningTransactionEvent).toHaveBeenCalledTimes(1);
        expect(mockCreateWarningTransactionGateway).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle if missing params', async () => {
        const message: HandleWarningTransactionCreatedEventRequest = {
          id: faker.datatype.uuid(),
          status: null,
        };

        const testScript = () =>
          observer.handleWarningTransactionCreatedEventViaJira(
            message,
            warningTransactionRepository,
            eventEmitter,
            logger,
            warningTransactionGateway,
            ctx,
          );

        expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitWarningTransactionEvent).toHaveBeenCalledTimes(0);
        expect(mockCreateWarningTransactionGateway).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle create warning transaction if status is already SENT', async () => {
        const { id, status } =
          await WarningTransactionFactory.create<WarningTransactionModel>(
            WarningTransactionModel.name,
            { status: WarningTransactionStatus.SENT },
          );

        const message: HandleWarningTransactionCreatedEventRequest = {
          id,
          status,
        };

        await observer.handleWarningTransactionCreatedEventViaJira(
          message,
          warningTransactionRepository,
          eventEmitter,
          logger,
          warningTransactionGateway,
          ctx,
        );

        expect(mockEmitWarningTransactionEvent).toHaveBeenCalledTimes(0);
        expect(mockCreateWarningTransactionGateway).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
