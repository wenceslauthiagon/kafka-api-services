import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { ConfigService } from '@nestjs/config';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import {
  PixInfractionRepository,
  PixInfractionState,
} from '@zro/pix-payments/domain';
import { PixInfractionGateway } from '@zro/pix-payments/application';
import * as cancelInfractionPspGatewayMock from '@zro/test/pix-payments/config/mocks/create_infraction.mock';
import {
  CancelPendingPixInfractionNestObserver as Observer,
  PixInfractionDatabaseRepository,
  PixInfractionModel,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCancelPendingPixInfractionEventRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { InfractionFactory } from '@zro/test/pix-payments/config';
import {
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
} from '@zro/topazio';

describe('CancelPendingPixInfractionNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let infractionRepository: PixInfractionRepository;
  let configService: ConfigService<TopazioGatewayConfig>;

  const kafkaService: KafkaService = createMock<KafkaService>();

  const eventEmitter: PixInfractionEventEmitterControllerInterface =
    createMock<PixInfractionEventEmitterControllerInterface>();
  const mockEmitInfractionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitInfractionEvent),
  );

  const pspGateway: PixInfractionGateway = createMock<PixInfractionGateway>();
  const mockCancelGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.cancelInfraction),
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

    const authConfig: TopazioAuthGatewayConfig = {
      appEnv: configService.get<string>('APP_ENV'),
      baseUrl: configService.get<string>('APP_TOPAZIO_AUTH_BASE_URL'),
      clientId: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_ID'),
      clientSecret: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_SECRET'),
    };
    TopazioAuthGateway.build(authConfig);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleCancelPendingInfraction', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not cancel if infraction not exists', async () => {
        const id = faker.datatype.uuid();
        const message: HandleCancelPendingPixInfractionEventRequest = {
          id,
          state: PixInfractionState.CANCEL_PENDING,
        };

        await controller.execute(
          message,
          pspGateway,
          infractionRepository,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockCancelGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should cancel infraction successfully', async () => {
        const { id, state } =
          await InfractionFactory.create<PixInfractionModel>(
            PixInfractionModel.name,
            {
              state: PixInfractionState.CANCEL_PENDING,
            },
          );

        mockCancelGateway.mockImplementationOnce(
          cancelInfractionPspGatewayMock.success,
        );

        const message: HandleCancelPendingPixInfractionEventRequest = {
          id,
          state,
        };

        await controller.execute(
          message,
          pspGateway,
          infractionRepository,
          eventEmitter,
          logger,
          ctx,
        );

        expect(mockCancelGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitInfractionEvent.mock.calls[0][1].state).toBe(
          PixInfractionState.CANCEL_CONFIRMED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
