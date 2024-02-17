import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KafkaService, defaultLogger as logger } from '@zro/common';
import {
  TopazioAuthGateway,
  TopazioAuthGatewayConfig,
  TopazioGatewayConfig,
} from '@zro/topazio';
import {
  AdminBankingAccountRepository,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import { BankingTedGateway } from '@zro/banking/application';
import {
  PendingAdminBankingTedNestObserver as Observer,
  AdminBankingTedDatabaseRepository,
  AdminBankingTedModel,
  AdminBankingAccountDatabaseRepository,
  AdminBankingAccountModel,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import {
  AdminBankingTedEventEmitterControllerInterface,
  AdminBankingTedEventType,
  HandlePendingAdminBankingTedEventRequest,
} from '@zro/banking/interface';
import * as createAdminBankingTedPspGatewayMock from '@zro/test/banking/config/mocks/create_banking_ted.mock';
import {
  AdminBankingAccountFactory,
  AdminBankingTedFactory,
} from '@zro/test/banking/config';
import { KafkaContext } from '@nestjs/microservices';

describe('PendingAdminBankingTedNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let bankingTedRepository: AdminBankingTedRepository;
  let adminBankingTedRepository: AdminBankingAccountRepository;
  let configService: ConfigService<TopazioGatewayConfig>;

  const bankingTedEmitter: AdminBankingTedEventEmitterControllerInterface =
    createMock<AdminBankingTedEventEmitterControllerInterface>();
  const mockEmitAdminBankingTedEvent: jest.Mock = On(bankingTedEmitter).get(
    method((mock) => mock.emitAdminBankingTedEvent),
  );

  const kafkaService: KafkaService = createMock<KafkaService>();

  const pspGateway: BankingTedGateway = createMock<BankingTedGateway>();
  const mockCreateGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.createBankingTed),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<Observer>(Observer);
    configService = module.get(ConfigService);
    bankingTedRepository = new AdminBankingTedDatabaseRepository();
    adminBankingTedRepository = new AdminBankingAccountDatabaseRepository();

    const authConfig: TopazioAuthGatewayConfig = {
      appEnv: configService.get<string>('APP_ENV'),
      baseUrl: configService.get<string>('APP_TOPAZIO_AUTH_BASE_URL'),
      clientId: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_ID'),
      clientSecret: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_SECRET'),
    };
    TopazioAuthGateway.build(authConfig);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandlePendingAdminBankingTedEventViaTopazio', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle createdAdminBankingTed send to PSP successfully', async () => {
        const adminBankingTed =
          await AdminBankingTedFactory.create<AdminBankingTedModel>(
            AdminBankingTedModel.name,
          );

        mockCreateGateway.mockImplementationOnce(
          createAdminBankingTedPspGatewayMock.success,
        );

        const message: HandlePendingAdminBankingTedEventRequest = {
          id: adminBankingTed.id,
          state: adminBankingTed.state,
        };

        await controller.handlePendingAdminBankingTedEventViaTopazio(
          message,
          adminBankingTedRepository,
          bankingTedRepository,
          bankingTedEmitter,
          pspGateway,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(1);
        expect(mockEmitAdminBankingTedEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitAdminBankingTedEvent.mock.calls[0][0]).toBe(
          AdminBankingTedEventType.WAITING,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle pending if do not exist', async () => {
        const adminBankingTed =
          await AdminBankingTedFactory.create<AdminBankingTedModel>(
            AdminBankingTedModel.name,
          );

        mockCreateGateway.mockImplementationOnce(
          createAdminBankingTedPspGatewayMock.success,
        );

        const message: HandlePendingAdminBankingTedEventRequest = {
          id: faker.datatype.uuid(),
          state: adminBankingTed.state,
        };

        await controller.handlePendingAdminBankingTedEventViaTopazio(
          message,
          adminBankingTedRepository,
          bankingTedRepository,
          bankingTedEmitter,
          pspGateway,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitAdminBankingTedEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle pending if invalid state', async () => {
        const adminBankingTed =
          await AdminBankingTedFactory.create<AdminBankingTedModel>(
            AdminBankingTedModel.name,
            { state: AdminBankingTedState.FAILED },
          );

        mockCreateGateway.mockImplementationOnce(
          createAdminBankingTedPspGatewayMock.success,
        );

        const message: HandlePendingAdminBankingTedEventRequest = {
          id: adminBankingTed.id,
          state: adminBankingTed.state,
        };

        await controller.handlePendingAdminBankingTedEventViaTopazio(
          message,
          adminBankingTedRepository,
          bankingTedRepository,
          bankingTedEmitter,
          pspGateway,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitAdminBankingTedEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - Should not handle pending if banking account do not found', async () => {
        const adminBankingAccount =
          await AdminBankingAccountFactory.create<AdminBankingAccountModel>(
            AdminBankingAccountModel.name,
            {
              enabled: false,
            },
          );

        const adminBankingTed =
          await AdminBankingTedFactory.create<AdminBankingTedModel>(
            AdminBankingTedModel.name,
            {
              sourceId: adminBankingAccount.id,
            },
          );

        mockCreateGateway.mockImplementationOnce(
          createAdminBankingTedPspGatewayMock.success,
        );

        const message: HandlePendingAdminBankingTedEventRequest = {
          id: adminBankingTed.id,
          state: adminBankingTed.state,
        };

        await controller.handlePendingAdminBankingTedEventViaTopazio(
          message,
          adminBankingTedRepository,
          bankingTedRepository,
          bankingTedEmitter,
          pspGateway,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitAdminBankingTedEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0005 - Should not handle pending if banking account do not active', async () => {
        const adminBankingAccount =
          await AdminBankingAccountFactory.create<AdminBankingAccountModel>(
            AdminBankingAccountModel.name,
            {
              enabled: false,
            },
          );

        const adminBankingTed =
          await AdminBankingTedFactory.create<AdminBankingTedModel>(
            AdminBankingTedModel.name,
            {
              destinationId: adminBankingAccount.id,
            },
          );

        mockCreateGateway.mockImplementationOnce(
          createAdminBankingTedPspGatewayMock.success,
        );

        const message: HandlePendingAdminBankingTedEventRequest = {
          id: adminBankingTed.id,
          state: adminBankingTed.state,
        };

        await controller.handlePendingAdminBankingTedEventViaTopazio(
          message,
          adminBankingTedRepository,
          bankingTedRepository,
          bankingTedEmitter,
          pspGateway,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitAdminBankingTedEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
