import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KafkaContext } from '@nestjs/microservices';
import { KafkaService, defaultLogger as logger } from '@zro/common';
import {
  PixDepositRepository,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
} from '@zro/topazio';
import {
  IssueWarningTransactionGateway,
  PixPaymentGateway,
} from '@zro/pix-payments/application';
import {
  PendingWarningPixDevolutionNestObserver as Observer,
  PixDepositDatabaseRepository,
  WarningPixDevolutionDatabaseRepository,
  WarningPixDevolutionModel,
  PixDepositModel,
  OperationServiceKafka,
  KAFKA_EVENTS,
  ComplianceServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePendingWarningPixDevolutionEventRequest,
  PixDevolutionEventType,
  WarningPixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import * as createWarningPixDevolutionPspGatewayMock from '@zro/test/pix-payments/config/mocks/create_pix_devolution.mock';
import {
  PixDepositFactory,
  WarningPixDevolutionFactory,
} from '@zro/test/pix-payments/config';

describe('PendingWarningPixDevolutionNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let warningPixDevolutionRepository: WarningPixDevolutionRepository;
  let depositRepository: PixDepositRepository;
  let configService: ConfigService<TopazioGatewayConfig>;

  const eventEmitter: WarningPixDevolutionEventEmitterControllerInterface =
    createMock<WarningPixDevolutionEventEmitterControllerInterface>();
  const mockEmitDevolutionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitDevolutionEvent),
  );

  const kafkaService: KafkaService = createMock<KafkaService>();
  const mockEmitkafkaService: jest.Mock = On(kafkaService).get(
    method((mock) => mock.emit),
  );

  const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
  const mockCreateGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.createWarningPixDevolution),
  );

  const issueWarningTransactionGateway: IssueWarningTransactionGateway =
    createMock<IssueWarningTransactionGateway>();
  const mockAddWarningTransactionCommentGateway: jest.Mock = On(
    issueWarningTransactionGateway,
  ).get(method((mock) => mock.addWarningTransactionComment));

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetOperationById: jest.Mock = On(operationService).get(
    method((mock) => mock.getOperationById),
  );

  const complianceService: ComplianceServiceKafka =
    createMock<ComplianceServiceKafka>();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<Observer>(Observer);
    configService = module.get(ConfigService);
    warningPixDevolutionRepository =
      new WarningPixDevolutionDatabaseRepository();
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

  describe('handlePendingWarningPixDevolutionEventViaTopazio', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle created WarningPixDevolution sent to PSP successfully', async () => {
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
        );

        const { id, userId, state } =
          await WarningPixDevolutionFactory.create<WarningPixDevolutionModel>(
            WarningPixDevolutionModel.name,
            {
              state: WarningPixDevolutionState.PENDING,
              operationId: deposit.operationId,
              endToEndId: deposit.endToEndId,
            },
          );

        mockGetOperationById.mockResolvedValue(deposit.toDomain().operation);
        mockCreateGateway.mockImplementationOnce(
          createWarningPixDevolutionPspGatewayMock.success,
        );

        const message: HandlePendingWarningPixDevolutionEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handlePendingWarningPixDevolutionEventViaTopazio(
          message,
          warningPixDevolutionRepository,
          depositRepository,
          eventEmitter,
          pspGateway,
          issueWarningTransactionGateway,
          operationService,
          complianceService,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(1);
        expect(mockAddWarningTransactionCommentGateway).toHaveBeenCalledTimes(
          0,
        );
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitDevolutionEvent.mock.calls[0][0]).toBe(
          PixDevolutionEventType.WAITING,
        );
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle created if incorrect state', async () => {
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
        );

        const { id, userId, state } =
          await WarningPixDevolutionFactory.create<WarningPixDevolutionModel>(
            WarningPixDevolutionModel.name,
            {
              state: WarningPixDevolutionState.CONFIRMED,
              operationId: deposit.operationId,
              endToEndId: deposit.endToEndId,
            },
          );

        const message: HandlePendingWarningPixDevolutionEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handlePendingWarningPixDevolutionEventViaTopazio(
          message,
          warningPixDevolutionRepository,
          depositRepository,
          eventEmitter,
          pspGateway,
          issueWarningTransactionGateway,
          operationService,
          complianceService,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(0);
        expect(mockAddWarningTransactionCommentGateway).toHaveBeenCalledTimes(
          0,
        );
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle created with psp offline', async () => {
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
        );

        const { id, userId, state } =
          await WarningPixDevolutionFactory.create<WarningPixDevolutionModel>(
            WarningPixDevolutionModel.name,
            {
              state: WarningPixDevolutionState.PENDING,
              operationId: deposit.operationId,
              endToEndId: deposit.endToEndId,
            },
          );

        mockGetOperationById.mockResolvedValue({});
        mockCreateGateway.mockImplementationOnce(
          createWarningPixDevolutionPspGatewayMock.offline,
        );

        const message: HandlePendingWarningPixDevolutionEventRequest = {
          id,
          userId,
          state,
        };

        await controller.handlePendingWarningPixDevolutionEventViaTopazio(
          message,
          warningPixDevolutionRepository,
          depositRepository,
          eventEmitter,
          pspGateway,
          issueWarningTransactionGateway,
          operationService,
          complianceService,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(1);
        expect(mockAddWarningTransactionCommentGateway).toHaveBeenCalledTimes(
          0,
        );
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
          KAFKA_EVENTS.WARNING_PIX_DEVOLUTION.REVERTED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
