import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KafkaContext } from '@nestjs/microservices';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
  KafkaService,
} from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  PixInfractionRefundOperationEntity,
  PixInfractionRefundOperationRepository,
  PixRefundDevolutionEntity,
  PixRefundDevolutionRepository,
  PixRefundDevolutionState,
  PixRefundEntity,
  PixRefundRepository,
} from '@zro/pix-payments/domain';
import { PixRefundGateway } from '@zro/pix-payments/application';
import {
  CompletePixRefundDevolutionNestObserver as Observer,
  OperationServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCompletePixRefundDevolutionEventRequest,
  PixRefundDevolutionEventEmitterControllerInterface,
  PixRefundEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  PixInfractionRefundOperationFactory,
  PixRefundDevolutionFactory,
  PixRefundFactory,
} from '@zro/test/pix-payments/config';
import {
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
} from '@zro/topazio';

describe('CompletePixRefundDevolutionController', () => {
  let module: TestingModule;
  let controller: Observer;
  let configService: ConfigService<TopazioGatewayConfig>;

  const kafkaService: KafkaService = createMock<KafkaService>();

  const serviceRefundDevolutionEventEmitter: PixRefundDevolutionEventEmitterControllerInterface =
    createMock<PixRefundDevolutionEventEmitterControllerInterface>();
  const mockEmitDevolutionEvent: jest.Mock = On(
    serviceRefundDevolutionEventEmitter,
  ).get(method((mock) => mock.emitDevolutionEvent));

  const serviceRefundEventEmitter: PixRefundEventEmitterControllerInterface =
    createMock<PixRefundEventEmitterControllerInterface>();
  const mockEmitPixRefundEvent: jest.Mock = On(serviceRefundEventEmitter).get(
    method((mock) => mock.emitPixRefundEvent),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockAcceptOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.acceptOperation),
  );

  const refundDevolutionRepository: PixRefundDevolutionRepository =
    createMock<PixRefundDevolutionRepository>();
  const mockGetByIdRefundDevolutionRepository: jest.Mock = On(
    refundDevolutionRepository,
  ).get(method((mock) => mock.getById));
  const mockUpdateRefundDevolutionRepository: jest.Mock = On(
    refundDevolutionRepository,
  ).get(method((mock) => mock.update));

  const refundRepository: PixRefundRepository =
    createMock<PixRefundRepository>();
  const mockGetByRefundDevolutionRefundRepository: jest.Mock = On(
    refundRepository,
  ).get(method((mock) => mock.getByRefundDevolution));
  const mockUpdateDevolutionRefundRepository: jest.Mock = On(
    refundRepository,
  ).get(method((mock) => mock.update));

  const pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository =
    createMock<PixInfractionRefundOperationRepository>();
  const mockGetAllPixInfractionRefundOperationByFilter: jest.Mock = On(
    pixInfractionRefundOperationRepository,
  ).get(method((mock) => mock.getAllByFilter));
  const mockUpdatePixInfractionRefundOperation: jest.Mock = On(
    pixInfractionRefundOperationRepository,
  ).get(method((mock) => mock.update));

  const pixRefundGateway: PixRefundGateway = createMock<PixRefundGateway>();
  const mockCloseRefundRequestPixRefundGateway: jest.Mock = On(
    pixRefundGateway,
  ).get(method((mock) => mock.closeRefundRequest));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<Observer>(Observer);
    configService = module.get(ConfigService);

    const authConfig: TopazioAuthGatewayConfig = {
      appEnv: configService.get<string>('APP_ENV'),
      baseUrl: configService.get<string>('APP_TOPAZIO_AUTH_BASE_URL'),
      clientId: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_ID'),
      clientSecret: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_SECRET'),
    };
    TopazioAuthGateway.build(authConfig);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CompleteRefund', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not update with invalid id', async () => {
        const refundDevolution =
          await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
            PixRefundDevolutionEntity.name,
          );

        mockGetByIdRefundDevolutionRepository.mockResolvedValue(null);

        const { state } = refundDevolution;

        const message: HandleCompletePixRefundDevolutionEventRequest = {
          id: null,
          state,
          userId: faker.datatype.uuid(),
        };

        const testScript = () =>
          controller.execute(
            message,
            refundDevolutionRepository,
            refundRepository,
            pixInfractionRefundOperationRepository,
            serviceRefundDevolutionEventEmitter,
            serviceRefundEventEmitter,
            operationService,
            logger,
            pixRefundGateway,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(0);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
        expect(mockEmitPixRefundEvent).toHaveBeenCalledTimes(0);
        expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
        expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByRefundDevolutionRefundRepository).toHaveBeenCalledTimes(
          0,
        );
        expect(mockUpdateDevolutionRefundRepository).toHaveBeenCalledTimes(0);
        expect(mockCloseRefundRequestPixRefundGateway).toHaveBeenCalledTimes(0);
      });
      it('TC0002 - Should not update with invalid userId', async () => {
        const refundDevolution =
          await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
            PixRefundDevolutionEntity.name,
          );

        const { id, state } = refundDevolution;

        mockGetByIdRefundDevolutionRepository.mockResolvedValue(
          refundDevolution,
        );

        const message: HandleCompletePixRefundDevolutionEventRequest = {
          id,
          state,
          userId: null,
        };

        const testScript = () =>
          controller.execute(
            message,
            refundDevolutionRepository,
            refundRepository,
            pixInfractionRefundOperationRepository,
            serviceRefundDevolutionEventEmitter,
            serviceRefundEventEmitter,
            operationService,
            logger,
            pixRefundGateway,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(0);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
        expect(mockEmitPixRefundEvent).toHaveBeenCalledTimes(0);
        expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
        expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByRefundDevolutionRefundRepository).toHaveBeenCalledTimes(
          0,
        );
        expect(mockUpdateDevolutionRefundRepository).toHaveBeenCalledTimes(0);
        expect(mockCloseRefundRequestPixRefundGateway).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0003 - Should create refund devolution successfully', async () => {
        const refundDevolution =
          await PixRefundDevolutionFactory.create<PixRefundDevolutionEntity>(
            PixRefundDevolutionEntity.name,
            {
              state: PixRefundDevolutionState.WAITING,
              user: new UserEntity({ uuid: faker.datatype.uuid() }),
            },
          );
        const { id, state } = refundDevolution;

        const refund = await PixRefundFactory.create<PixRefundEntity>(
          PixRefundEntity.name,
          { refundDevolution },
        );

        const pixInfractionRefundOperation =
          await PixInfractionRefundOperationFactory.create<PixInfractionRefundOperationEntity>(
            PixInfractionRefundOperationEntity.name,
            {
              pixRefund: refund,
            },
          );

        mockGetByIdRefundDevolutionRepository.mockResolvedValue(
          refundDevolution,
        );
        mockGetByRefundDevolutionRefundRepository.mockResolvedValue(refund);
        mockGetAllPixInfractionRefundOperationByFilter.mockResolvedValue([
          pixInfractionRefundOperation,
        ]);

        const message: HandleCompletePixRefundDevolutionEventRequest = {
          id,
          state,
          userId: refundDevolution.user.uuid,
        };

        await controller.execute(
          message,
          refundDevolutionRepository,
          refundRepository,
          pixInfractionRefundOperationRepository,
          serviceRefundDevolutionEventEmitter,
          serviceRefundEventEmitter,
          operationService,
          logger,
          pixRefundGateway,
          ctx,
        );

        expect(mockGetByIdRefundDevolutionRepository).toHaveBeenCalledTimes(1);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixRefundEvent).toHaveBeenCalledTimes(1);
        expect(mockAcceptOperationService).toHaveBeenCalledTimes(1);
        expect(mockUpdateRefundDevolutionRepository).toHaveBeenCalledTimes(1);
        expect(mockGetByRefundDevolutionRefundRepository).toHaveBeenCalledTimes(
          1,
        );
        expect(mockUpdateDevolutionRefundRepository).toHaveBeenCalledTimes(1);
        expect(mockCloseRefundRequestPixRefundGateway).toHaveBeenCalledTimes(1);
        expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(1);
      });
    });
  });
  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
