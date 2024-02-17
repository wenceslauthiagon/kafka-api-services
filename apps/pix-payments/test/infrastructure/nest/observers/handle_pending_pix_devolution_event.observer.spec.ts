import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import {
  PaymentRepository,
  PixDepositRepository,
  PixDevolutionReceivedRepository,
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
  PendingPixDevolutionNestObserver as Observer,
  PixDevolutionDatabaseRepository,
  PixDevolutionModel,
  OperationServiceKafka,
  PixDepositDatabaseRepository,
  KAFKA_EVENTS,
  PaymentDatabaseRepository,
  PixDevolutionReceivedDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePendingPixDevolutionEventRequest,
  PixDevolutionEventEmitterControllerInterface,
  PixDevolutionEventType,
  PixDevolutionReceivedEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixDevolutionFactory } from '@zro/test/pix-payments/config';
import * as createPixDevolutionPspGatewayMock from '@zro/test/pix-payments/config/mocks/create_pix_devolution.mock';

describe('PendingPixDevolutionNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let devolutionRepository: PixDevolutionRepository;
  let depositRepository: PixDepositRepository;
  let paymentRepository: PaymentRepository;
  let devolutionReceivedRepository: PixDevolutionReceivedRepository;
  let configService: ConfigService<TopazioGatewayConfig>;

  const eventEmitter: PixDevolutionEventEmitterControllerInterface =
    createMock<PixDevolutionEventEmitterControllerInterface>();
  const mockEmitDevolutionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitDevolutionEvent),
  );

  const eventDevolutionReceivedEmitter: PixDevolutionReceivedEventEmitterControllerInterface =
    createMock<PixDevolutionReceivedEventEmitterControllerInterface>();

  const kafkaService: KafkaService = createMock<KafkaService>();
  const mockEmitkafkaService: jest.Mock = On(kafkaService).get(
    method((mock) => mock.emit),
  );

  const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
  const mockCreateGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.createPixDevolution),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.getWalletAccountByAccountNumberAndCurrency),
  );
  const mockCreateOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.createOperation),
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
    paymentRepository = new PaymentDatabaseRepository();
    devolutionReceivedRepository =
      new PixDevolutionReceivedDatabaseRepository();

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
      it('TC0001 - Should handle created PixDevolution send to PSP successfully', async () => {
        const { id, userId, state } =
          await PixDevolutionFactory.create<PixDevolutionModel>(
            PixDevolutionModel.name,
            { state: PixDevolutionState.PENDING },
          );
        mockCreateGateway.mockImplementationOnce(
          createPixDevolutionPspGatewayMock.success,
        );

        const message: HandlePendingPixDevolutionEventRequest = {
          id,
          userId,
          state,
          walletId: faker.datatype.uuid(),
        };

        await controller.handlePendingPixDevolutionEventViaTopazio(
          message,
          devolutionRepository,
          depositRepository,
          eventEmitter,
          pspGateway,
          operationService,
          paymentRepository,
          devolutionReceivedRepository,
          eventDevolutionReceivedEmitter,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(1);
        expect(mockGetOperationService).toHaveBeenCalledTimes(0);
        expect(mockCreateOperationService).toHaveBeenCalledTimes(1);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitDevolutionEvent.mock.calls[0][0]).toBe(
          PixDevolutionEventType.WAITING,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle created if incorrect state', async () => {
        const { id, userId, state } =
          await PixDevolutionFactory.create<PixDevolutionModel>(
            PixDevolutionModel.name,
            { state: PixDevolutionState.CONFIRMED },
          );

        const message: HandlePendingPixDevolutionEventRequest = {
          id,
          userId,
          state,
          walletId: faker.datatype.uuid(),
        };

        await controller.handlePendingPixDevolutionEventViaTopazio(
          message,
          devolutionRepository,
          depositRepository,
          eventEmitter,
          pspGateway,
          operationService,
          paymentRepository,
          devolutionReceivedRepository,
          eventDevolutionReceivedEmitter,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle created with psp offline', async () => {
        const { id, userId, state } =
          await PixDevolutionFactory.create<PixDevolutionModel>(
            PixDevolutionModel.name,
            { state: PixDevolutionState.PENDING },
          );
        mockCreateGateway.mockImplementationOnce(
          createPixDevolutionPspGatewayMock.offline,
        );

        const message: HandlePendingPixDevolutionEventRequest = {
          id,
          userId,
          state,
          walletId: faker.datatype.uuid(),
        };

        await controller.handlePendingPixDevolutionEventViaTopazio(
          message,
          devolutionRepository,
          depositRepository,
          eventEmitter,
          pspGateway,
          operationService,
          paymentRepository,
          devolutionReceivedRepository,
          eventDevolutionReceivedEmitter,
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
