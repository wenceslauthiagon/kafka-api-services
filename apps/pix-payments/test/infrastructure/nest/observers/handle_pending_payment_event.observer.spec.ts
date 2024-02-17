import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import {
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
} from '@zro/topazio';
import {
  PaymentRepository,
  PaymentState,
  PixDepositRepository,
} from '@zro/pix-payments/domain';
import {
  PendingPaymentNestObserver as Observer,
  PaymentDatabaseRepository,
  PaymentModel,
  OperationServiceKafka,
  BankingServiceKafka,
  PixDepositDatabaseRepository,
  KAFKA_EVENTS,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePendingPaymentEventRequest,
  PaymentEventEmitterControllerInterface,
  PaymentEventType,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { PixPaymentGateway } from '@zro/pix-payments/application';
import { PaymentFactory } from '@zro/test/pix-payments/config';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import * as createPaymentPspGatewayMock from '@zro/test/pix-payments/config/mocks/create_payment.mock';
import { BankEntity } from '@zro/banking/domain';
import { KafkaContext } from '@nestjs/microservices';

describe('PendingPaymentNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let depositRepository: PixDepositRepository;
  let paymentRepository: PaymentRepository;
  let configService: ConfigService<TopazioGatewayConfig>;

  const paymentEmitter: PaymentEventEmitterControllerInterface =
    createMock<PaymentEventEmitterControllerInterface>();
  const mockEmitPaymentEvent: jest.Mock = On(paymentEmitter).get(
    method((mock) => mock.emitPaymentEvent),
  );

  const depositEmitter: PixDepositEventEmitterControllerInterface =
    createMock<PixDepositEventEmitterControllerInterface>();
  const mockEmitDepositEvent: jest.Mock = On(depositEmitter).get(
    method((mock) => mock.emitDepositEvent),
  );

  const kafkaService: KafkaService = createMock<KafkaService>();
  const mockEmitkafkaService: jest.Mock = On(kafkaService).get(
    method((mock) => mock.emit),
  );

  const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
  const mockCreateGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.createPayment),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.getWalletAccountByAccountNumberAndCurrency),
  );
  const mockCreateOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.createOperation),
  );

  const bankingService: BankingServiceKafka = createMock<BankingServiceKafka>();
  const mockGetBankingService: jest.Mock = On(bankingService).get(
    method((mock) => mock.getBankByIspb),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<Observer>(Observer);
    configService = module.get(ConfigService);
    depositRepository = new PixDepositDatabaseRepository();
    paymentRepository = new PaymentDatabaseRepository();

    const authConfig: TopazioAuthGatewayConfig = {
      appEnv: configService.get<string>('APP_ENV'),
      baseUrl: configService.get<string>('APP_TOPAZIO_AUTH_BASE_URL'),
      clientId: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_ID'),
      clientSecret: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_SECRET'),
    };
    TopazioAuthGateway.build(authConfig);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandlePendingPaymentEventViaTopazio', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle created Payment send to PSP successfully', async () => {
        const { id, userId, state } = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
          { state: PaymentState.PENDING },
        );
        const banking = new BankEntity({ ispb: '0' });
        mockCreateGateway.mockImplementationOnce(
          createPaymentPspGatewayMock.success,
        );
        mockGetBankingService.mockResolvedValue(banking);

        const message: HandlePendingPaymentEventRequest = {
          id,
          userId,
          state,
          walletId: faker.datatype.uuid(),
        };

        await controller.handlePendingPaymentEventViaTopazio(
          message,
          paymentRepository,
          depositRepository,
          paymentEmitter,
          depositEmitter,
          pspGateway,
          operationService,
          bankingService,
          logger,
          ctx,
        );

        expect(mockGetBankingService).toHaveBeenCalledTimes(0);
        expect(mockCreateGateway).toHaveBeenCalledTimes(1);
        expect(mockGetOperationService).toHaveBeenCalledTimes(0);
        expect(mockCreateOperationService).toHaveBeenCalledTimes(1);
        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPaymentEvent.mock.calls[0][0]).toBe(
          PaymentEventType.WAITING,
        );
        expect(mockEmitDepositEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle created if incorrect state', async () => {
        const { id, userId, state } = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
          { state: PaymentState.CONFIRMED },
        );

        const message: HandlePendingPaymentEventRequest = {
          id,
          userId,
          state,
          walletId: faker.datatype.uuid(),
        };

        await controller.handlePendingPaymentEventViaTopazio(
          message,
          paymentRepository,
          depositRepository,
          paymentEmitter,
          depositEmitter,
          pspGateway,
          operationService,
          bankingService,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(0);
        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(0);
        expect(mockEmitDepositEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle created with psp offline', async () => {
        const { id, userId, state } = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
          { state: PaymentState.PENDING },
        );
        const banking = new BankEntity({ ispb: '0' });
        mockCreateGateway.mockImplementationOnce(
          createPaymentPspGatewayMock.offline,
        );
        mockGetBankingService.mockResolvedValue(banking);

        const message: HandlePendingPaymentEventRequest = {
          id,
          userId,
          state,
          walletId: faker.datatype.uuid(),
        };

        await controller.handlePendingPaymentEventViaTopazio(
          message,
          paymentRepository,
          depositRepository,
          paymentEmitter,
          depositEmitter,
          pspGateway,
          operationService,
          bankingService,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
        expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
          KAFKA_EVENTS.PAYMENT.REVERTED,
        );
        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(0);
        expect(mockEmitDepositEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
