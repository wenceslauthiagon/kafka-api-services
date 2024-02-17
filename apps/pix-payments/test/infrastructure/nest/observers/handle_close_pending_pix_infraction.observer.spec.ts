import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import {
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
} from '@zro/topazio';
import {
  PixInfractionRepository,
  PixInfractionState,
} from '@zro/pix-payments/domain';
import { PixInfractionGateway } from '@zro/pix-payments/application';
import {
  ClosePendingPixInfractionNestObserver as Observer,
  PixInfractionDatabaseRepository,
  PixInfractionModel,
} from '@zro/pix-payments/infrastructure';
import {
  HandleClosePendingPixInfractionEventRequest,
  PixInfractionEventEmitterControllerInterface,
  PixInfractionEventType,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { InfractionFactory } from '@zro/test/pix-payments/config';

describe('HandleClosePendingInfractionMicroserviceObserver', () => {
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

  const infractionGateway: PixInfractionGateway =
    createMock<PixInfractionGateway>();
  const mockCloseInfractionPixInfractionGateway: jest.Mock = On(
    infractionGateway,
  ).get(method((mock) => mock.closeInfraction));

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

  describe('HandleClosePendingInfraction', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create if infraction no exists', async () => {
        const message: HandleClosePendingPixInfractionEventRequest = {
          id: faker.datatype.uuid(),
          state: PixInfractionState.CLOSED_PENDING,
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
        expect(mockCloseInfractionPixInfractionGateway).toHaveBeenCalledTimes(
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
              state: PixInfractionState.CLOSED_PENDING,
            },
          );

        const message: HandleClosePendingPixInfractionEventRequest = {
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
        expect(mockCloseInfractionPixInfractionGateway).toHaveBeenCalledTimes(
          1,
        );
        expect(mockEmitInfractionEvent.mock.calls[0][0]).toBe(
          PixInfractionEventType.CLOSED_CONFIRMED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
