import { faker } from '@faker-js/faker/locale/pt_BR';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { KafkaService, defaultLogger as logger } from '@zro/common';
import {
  TopazioAuthGateway,
  TopazioGatewayConfig,
  TopazioAuthGatewayConfig,
} from '@zro/topazio';
import {
  PaymentRepository,
  PixDevolutionRepository,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionTransactionType,
} from '@zro/pix-payments/domain';
import {
  IssueInfractionGateway,
  PixInfractionGateway,
} from '@zro/pix-payments/application';
import {
  OpenPendingPixInfractionNestObserver as Observer,
  PixInfractionDatabaseRepository,
  PixInfractionModel,
  PaymentDatabaseRepository,
  PixDevolutionDatabaseRepository,
  PaymentModel,
} from '@zro/pix-payments/infrastructure';
import {
  HandleOpenPendingPixInfractionEventRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import * as createInfractionPspGatewayMock from '@zro/test/pix-payments/config/mocks/create_infraction.mock';
import {
  InfractionFactory,
  PaymentFactory,
} from '@zro/test/pix-payments/config';

describe('HandleOpenPendingInfractionMicroserviceObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let infractionRepository: PixInfractionRepository;
  let paymentRepository: PaymentRepository;
  let devolutionRepository: PixDevolutionRepository;
  let configService: ConfigService<TopazioGatewayConfig>;

  const kafkaService: KafkaService = createMock<KafkaService>();

  const eventEmitter: PixInfractionEventEmitterControllerInterface =
    createMock<PixInfractionEventEmitterControllerInterface>();
  const mockEmitInfractionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitInfractionEvent),
  );

  const pspGateway: PixInfractionGateway = createMock<PixInfractionGateway>();
  const mockCreateGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.createInfraction),
  );

  const infractionGateway: IssueInfractionGateway =
    createMock<IssueInfractionGateway>();
  const mockUpdateInfractionGateway: jest.Mock = On(infractionGateway).get(
    method((mock) => mock.updateInfraction),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<Observer>(Observer);
    configService = module.get(ConfigService);
    infractionRepository = new PixInfractionDatabaseRepository();
    paymentRepository = new PaymentDatabaseRepository();
    devolutionRepository = new PixDevolutionDatabaseRepository();

    const authConfig: TopazioAuthGatewayConfig = {
      appEnv: configService.get<string>('APP_ENV'),
      baseUrl: configService.get<string>('APP_TOPAZIO_AUTH_BASE_URL'),
      clientId: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_ID'),
      clientSecret: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_SECRET'),
    };
    TopazioAuthGateway.build(authConfig);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleOpenPendingInfraction', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create if infraction no exists', async () => {
        const id = faker.datatype.uuid();
        const message: HandleOpenPendingPixInfractionEventRequest = {
          id,
          state: PixInfractionState.OPEN_PENDING,
        };

        await controller.execute(
          message,
          pspGateway,
          infractionGateway,
          infractionRepository,
          paymentRepository,
          devolutionRepository,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(0);
        expect(mockUpdateInfractionGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should create infraction successfully', async () => {
        const payment = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
        );

        const { id, state } =
          await InfractionFactory.create<PixInfractionModel>(
            PixInfractionModel.name,
            {
              transactionType: PixInfractionTransactionType.PAYMENT,
              state: PixInfractionState.OPEN_PENDING,
              transaction: payment,
            },
          );

        mockCreateGateway.mockImplementationOnce(
          createInfractionPspGatewayMock.success,
        );

        const message: HandleOpenPendingPixInfractionEventRequest = {
          id,
          state,
        };

        await controller.execute(
          message,
          pspGateway,
          infractionGateway,
          infractionRepository,
          paymentRepository,
          devolutionRepository,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(1);
        expect(mockUpdateInfractionGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitInfractionEvent.mock.calls[0][1].state).toBe(
          PixInfractionState.OPEN_CONFIRMED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
