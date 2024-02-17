import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import {
  PixInfractionRepository,
  PixInfractionState,
} from '@zro/pix-payments/domain';
import { IssueInfractionGateway } from '@zro/pix-payments/application';
import {
  CancelPendingPixInfractionReceivedNestObserver as Observer,
  PixInfractionDatabaseRepository,
  PixInfractionModel,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCancelPendingPixInfractionReceivedEventRequest,
  PixInfractionEventEmitterControllerInterface,
  PixInfractionEventType,
} from '@zro/pix-payments/interface';
import { InfractionFactory } from '@zro/test/pix-payments/config';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';

describe('CancelPendingPixInfractionReceivedNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let infractionRepository: PixInfractionRepository;

  const kafkaService: KafkaService = createMock<KafkaService>();

  const eventEmitter: PixInfractionEventEmitterControllerInterface =
    createMock<PixInfractionEventEmitterControllerInterface>();
  const mockEmitInfractionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitInfractionEvent),
  );

  const issueInfractionGateway: IssueInfractionGateway =
    createMock<IssueInfractionGateway>();
  const mockUpdateStatusIssuePixInfractionGateway: jest.Mock = On(
    issueInfractionGateway,
  ).get(method((mock) => mock.updateInfractionStatus));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<Observer>(Observer);
    infractionRepository = new PixInfractionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleCancelPendingPixInfractionReceived', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create if infraction no exists', async () => {
        const message: HandleCancelPendingPixInfractionReceivedEventRequest = {
          id: faker.datatype.uuid(),
          state: PixInfractionState.CANCEL_PENDING,
        };

        await controller.execute(
          message,
          infractionRepository,
          issueInfractionGateway,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(0);
        expect(mockUpdateStatusIssuePixInfractionGateway).toHaveBeenCalledTimes(
          0,
        );
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should create infraction successfully', async () => {
        const { id, state } =
          await InfractionFactory.create<PixInfractionModel>(
            PixInfractionModel.name,
            {
              state: PixInfractionState.CANCEL_PENDING,
            },
          );

        const message: HandleCancelPendingPixInfractionReceivedEventRequest = {
          id,
          state,
        };

        await controller.execute(
          message,
          infractionRepository,
          issueInfractionGateway,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(1);
        expect(mockUpdateStatusIssuePixInfractionGateway).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEmitInfractionEvent.mock.calls[0][0]).toBe(
          PixInfractionEventType.CANCEL_CONFIRMED_RECEIVED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
