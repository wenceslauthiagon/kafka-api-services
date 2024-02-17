import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import {
  PixInfractionRepository,
  PixInfractionState,
} from '@zro/pix-payments/domain';
import { IssueInfractionGateway } from '@zro/pix-payments/application';
import {
  AcknowledgePendingPixInfractionNestObserver as Observer,
  PixInfractionDatabaseRepository,
  PixInfractionModel,
} from '@zro/pix-payments/infrastructure';
import {
  HandleAcknowledgePendingPixInfractionEventRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { InfractionFactory } from '@zro/test/pix-payments/config';

describe('HandleAcknowledgePendingInfractionMicroserviceObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let infractionRepository: PixInfractionRepository;

  const kafkaService: KafkaService = createMock<KafkaService>();

  const eventEmitter: PixInfractionEventEmitterControllerInterface =
    createMock<PixInfractionEventEmitterControllerInterface>();
  const mockEmitInfractionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitInfractionEvent),
  );

  const infractionGateway: IssueInfractionGateway =
    createMock<IssueInfractionGateway>();
  const mockUpdateStatusInfractionGateway: jest.Mock = On(
    infractionGateway,
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

  describe('HandleAcknowledgePendingInfraction', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create if infraction no exists', async () => {
        const message: HandleAcknowledgePendingPixInfractionEventRequest = {
          id: faker.datatype.uuid(),
          state: PixInfractionState.OPEN_CONFIRMED,
        };

        await controller.execute(
          message,
          infractionRepository,
          infractionGateway,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(0);
        expect(mockUpdateStatusInfractionGateway).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should create infraction successfully', async () => {
        const { id, state } =
          await InfractionFactory.create<PixInfractionModel>(
            PixInfractionModel.name,
            {
              state: PixInfractionState.ACKNOWLEDGED_PENDING,
            },
          );

        const message: HandleAcknowledgePendingPixInfractionEventRequest = {
          id,
          state,
        };

        await controller.execute(
          message,
          infractionRepository,
          infractionGateway,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(1);
        expect(mockUpdateStatusInfractionGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitInfractionEvent.mock.calls[0][0]).toBe(
          PixInfractionState.ACKNOWLEDGED_CONFIRMED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
