import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import { PixRefundRepository, PixRefundState } from '@zro/pix-payments/domain';
import {
  ClosePendingPixRefundNestObserver as Observer,
  PixDepositModel,
  PixRefundDatabaseRepository,
  PixRefundModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  HandleClosePendingPixRefundEventRequest,
  PixRefundDevolutionEventEmitterControllerInterface,
  PixRefundDevolutionEventType,
  PixRefundEventEmitterControllerInterface,
  PixRefundEventType,
} from '@zro/pix-payments/interface';
import {
  PixDepositFactory,
  PixRefundFactory,
} from '@zro/test/pix-payments/config';

describe('ClosePendingPixRefundNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let refundRepository: PixRefundRepository;

  const kafkaService: KafkaService = createMock<KafkaService>();

  const eventEmitter: PixRefundEventEmitterControllerInterface =
    createMock<PixRefundEventEmitterControllerInterface>();
  const mockEmitRefundEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitPixRefundEvent),
  );

  const eventRefundDevolutionEmitter: PixRefundDevolutionEventEmitterControllerInterface =
    createMock<PixRefundDevolutionEventEmitterControllerInterface>();
  const mockEmitRefundDevolutionEvent: jest.Mock = On(
    eventRefundDevolutionEmitter,
  ).get(method((mock) => mock.emitDevolutionEvent));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<Observer>(Observer);
    refundRepository = new PixRefundDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleClosePendingRefund', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create if refund no exists', async () => {
        const message: HandleClosePendingPixRefundEventRequest = {
          id: faker.datatype.uuid(),
          state: PixRefundState.CLOSED_PENDING,
        };

        await controller.execute(
          message,
          refundRepository,
          eventEmitter,
          eventRefundDevolutionEmitter,
          logger,
          ctx,
        );

        expect(mockEmitRefundEvent).toHaveBeenCalledTimes(0);
        expect(mockEmitRefundDevolutionEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should create refund successfully', async () => {
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
        );

        const { id, state } = await PixRefundFactory.create<PixRefundModel>(
          PixRefundModel.name,
          {
            state: PixRefundState.CLOSED_PENDING,
            transaction: deposit,
          },
        );

        const message: HandleClosePendingPixRefundEventRequest = {
          id,
          state,
        };

        await controller.execute(
          message,
          refundRepository,
          eventEmitter,
          eventRefundDevolutionEmitter,
          logger,
          ctx,
        );

        expect(mockEmitRefundEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitRefundDevolutionEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitRefundEvent.mock.calls[0][0]).toBe(
          PixRefundEventType.CLOSED_WAITING,
        );
        expect(mockEmitRefundDevolutionEvent.mock.calls[0][0]).toBe(
          PixRefundDevolutionEventType.CREATED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
