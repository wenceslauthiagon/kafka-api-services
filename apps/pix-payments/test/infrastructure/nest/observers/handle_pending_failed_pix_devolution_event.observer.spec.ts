import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import {
  PixDepositRepository,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import { PixPaymentGateway } from '@zro/pix-payments/application';
import {
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
} from '@zro/topazio';
import {
  PendingFailedPixDevolutionNestObserver as Observer,
  PixDevolutionDatabaseRepository,
  PixDevolutionModel,
  PixDepositDatabaseRepository,
  KAFKA_EVENTS,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePendingFailedPixDevolutionEventRequest,
  PixDevolutionEventEmitterControllerInterface,
  PixDevolutionEventType,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import * as createPixDevolutionPspGatewayMock from '@zro/test/pix-payments/config/mocks/create_pix_devolution.mock';
import { PixDevolutionFactory } from '@zro/test/pix-payments/config';

describe('PendingFailedPixDevolutionNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let devolutionRepository: PixDevolutionRepository;
  let depositRepository: PixDepositRepository;
  let configService: ConfigService<TopazioGatewayConfig>;

  const eventEmitter: PixDevolutionEventEmitterControllerInterface =
    createMock<PixDevolutionEventEmitterControllerInterface>();
  const mockEmitDevolutionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitDevolutionEvent),
  );

  const kafkaService: KafkaService = createMock<KafkaService>();
  const mockEmitkafkaService: jest.Mock = On(kafkaService).get(
    method((mock) => mock.emit),
  );

  const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
  const mockCreateGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.createPixDevolution),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<Observer>(Observer);
    configService = module.get(ConfigService);
    devolutionRepository = new PixDevolutionDatabaseRepository();
    depositRepository = new PixDepositDatabaseRepository();

    const authConfig: TopazioAuthGatewayConfig = {
      appEnv: configService.get<string>('APP_ENV'),
      baseUrl: configService.get<string>('APP_TOPAZIO_AUTH_BASE_URL'),
      clientId: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_ID'),
      clientSecret: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_SECRET'),
    };
    TopazioAuthGateway.build(authConfig);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandlePendingPixDevolutionEventViaTopazio', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle created PixDevolution sent to PSP successfully', async () => {
        const { id, userId, walletId, state } =
          await PixDevolutionFactory.create<PixDevolutionModel>(
            PixDevolutionModel.name,
            { state: PixDevolutionState.PENDING },
          );

        mockCreateGateway.mockImplementationOnce(
          createPixDevolutionPspGatewayMock.success,
        );

        const message: HandlePendingFailedPixDevolutionEventRequest = {
          id,
          userId,
          walletId,
          state,
        };

        await controller.handlePendingFailedPixDevolutionEventViaTopazio(
          message,
          devolutionRepository,
          depositRepository,
          eventEmitter,
          pspGateway,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitDevolutionEvent.mock.calls[0][0]).toBe(
          PixDevolutionEventType.WAITING,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle created if incorrect state', async () => {
        const { id, userId, walletId, state } =
          await PixDevolutionFactory.create<PixDevolutionModel>(
            PixDevolutionModel.name,
            { state: PixDevolutionState.CONFIRMED },
          );

        const message: HandlePendingFailedPixDevolutionEventRequest = {
          id,
          userId,
          walletId,
          state,
        };

        await controller.handlePendingFailedPixDevolutionEventViaTopazio(
          message,
          devolutionRepository,
          depositRepository,
          eventEmitter,
          pspGateway,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle created with psp offline', async () => {
        const { id, userId, walletId, state } =
          await PixDevolutionFactory.create<PixDevolutionModel>(
            PixDevolutionModel.name,
            { state: PixDevolutionState.PENDING },
          );

        mockCreateGateway.mockImplementationOnce(
          createPixDevolutionPspGatewayMock.offline,
        );

        const message: HandlePendingFailedPixDevolutionEventRequest = {
          id,
          userId,
          walletId,
          state,
        };

        await controller.handlePendingFailedPixDevolutionEventViaTopazio(
          message,
          devolutionRepository,
          depositRepository,
          eventEmitter,
          pspGateway,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
          KAFKA_EVENTS.PIX_DEVOLUTION.REVERTED,
        );
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
