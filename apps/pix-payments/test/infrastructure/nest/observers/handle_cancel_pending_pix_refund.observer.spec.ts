import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import {
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
} from '@zro/topazio';
import { PixRefundRepository, PixRefundState } from '@zro/pix-payments/domain';
import { PixRefundGateway } from '@zro/pix-payments/application';
import {
  CancelPendingPixRefundNestObserver as Observer,
  PixRefundDatabaseRepository,
  PixRefundModel,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCancelPendingPixRefundEventRequest,
  PixRefundEventEmitterControllerInterface,
  PixRefundEventType,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixRefundFactory } from '@zro/test/pix-payments/config';

describe('CancelPendingPixRefundNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let refundRepository: PixRefundRepository;
  let configService: ConfigService<TopazioGatewayConfig>;

  const kafkaService: KafkaService = createMock<KafkaService>();

  const eventEmitter: PixRefundEventEmitterControllerInterface =
    createMock<PixRefundEventEmitterControllerInterface>();
  const mockEmitRefundEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitPixRefundEvent),
  );

  const pixRefundGateway: PixRefundGateway = createMock<PixRefundGateway>();
  const mockCancelPixRefundGateway: jest.Mock = On(pixRefundGateway).get(
    method((mock) => mock.cancelRefundRequest),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<Observer>(Observer);
    configService = module.get(ConfigService);
    refundRepository = new PixRefundDatabaseRepository();

    const authConfig: TopazioAuthGatewayConfig = {
      appEnv: configService.get<string>('APP_ENV'),
      baseUrl: configService.get<string>('APP_TOPAZIO_AUTH_BASE_URL'),
      clientId: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_ID'),
      clientSecret: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_SECRET'),
    };
    TopazioAuthGateway.build(authConfig);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleCancelPendingRefund', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create if refund no exists', async () => {
        const message: HandleCancelPendingPixRefundEventRequest = {
          id: faker.datatype.uuid(),
          state: PixRefundState.CANCEL_PENDING,
        };

        await controller.execute(
          message,
          refundRepository,
          pixRefundGateway,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockEmitRefundEvent).toHaveBeenCalledTimes(0);
        expect(mockCancelPixRefundGateway).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should create refund successfully', async () => {
        const { id, state } = await PixRefundFactory.create<PixRefundModel>(
          PixRefundModel.name,
          {
            state: PixRefundState.CANCEL_PENDING,
          },
        );

        const message: HandleCancelPendingPixRefundEventRequest = {
          id,
          state,
        };

        await controller.execute(
          message,
          refundRepository,
          pixRefundGateway,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockEmitRefundEvent).toHaveBeenCalledTimes(1);
        expect(mockCancelPixRefundGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitRefundEvent.mock.calls[0][0]).toBe(
          PixRefundEventType.CANCEL_CONFIRMED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
