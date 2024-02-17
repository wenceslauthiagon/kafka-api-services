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
import { OnboardingEntity, UserEntity } from '@zro/users/domain';
import {
  BankingTedState,
  BankTedRepository,
  BankingTedRepository,
  BankingContactRepository,
  BankingTedReceivedRepository,
  BankingAccountContactRepository,
} from '@zro/banking/domain';
import {
  WalletAccountEntity,
  WalletAccountState,
  WalletEntity,
  WalletState,
} from '@zro/operations/domain';
import { BankingTedGateway } from '@zro/banking/application';
import {
  PendingBankingTedNestObserver as Observer,
  BankingTedDatabaseRepository,
  BankingTedModel,
  OperationServiceKafka,
  UserServiceKafka,
  BankTedDatabaseRepository,
  BankTedModel,
  BankingTedReceivedDatabaseRepository,
  BankingContactDatabaseRepository,
  BankingAccountContactDatabaseRepository,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import {
  BankingTedEventEmitterControllerInterface,
  BankingTedEventType,
  BankingTedReceivedEventEmitterControllerInterface,
  BankingTedReceivedEventType,
  HandlePendingBankingTedEventRequest,
} from '@zro/banking/interface';
import * as createBankingTedPspGatewayMock from '@zro/test/banking/config/mocks/create_banking_ted.mock';
import { OnboardingFactory, UserFactory } from '@zro/test/users/config';
import {
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import { BankingTedFactory, BankTedFactory } from '@zro/test/banking/config';
import { KafkaContext } from '@nestjs/microservices';

describe('PendingBankingTedNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let bankTedRepository: BankTedRepository;
  let bankingTedRepository: BankingTedRepository;
  let bankingTedReceivedRepository: BankingTedReceivedRepository;
  let bankingContactRepository: BankingContactRepository;
  let bankingAccountContactRepository: BankingAccountContactRepository;
  let configService: ConfigService<TopazioGatewayConfig>;

  const bankingTedEmitter: BankingTedEventEmitterControllerInterface =
    createMock<BankingTedEventEmitterControllerInterface>();
  const mockEmitBankingTedEvent: jest.Mock = On(bankingTedEmitter).get(
    method((mock) => mock.emitBankingTedEvent),
  );

  const bankingTedReceivedEmitter: BankingTedReceivedEventEmitterControllerInterface =
    createMock<BankingTedReceivedEventEmitterControllerInterface>();
  const mockEmitBankingTedReceivedEvent: jest.Mock = On(
    bankingTedReceivedEmitter,
  ).get(method((mock) => mock.emitBankingTedReceivedEvent));

  const kafkaService: KafkaService = createMock<KafkaService>();

  const pspGateway: BankingTedGateway = createMock<BankingTedGateway>();
  const mockCreateGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.createBankingTed),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetWalletAccountByUserService: jest.Mock = On(operationService).get(
    method((mock) => mock.getWalletAccountByWalletAndCurrency),
  );
  const mockCreateAndAcceptOperationService: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.createAndAcceptOperation));
  const mockGetDefaultUserWallet: jest.Mock = On(operationService).get(
    method((mock) => mock.getWalletByUserAndDefaultIsTrue),
  );

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );
  const mockGetUserOnboarding: jest.Mock = On(userService).get(
    method((mock) => mock.getOnboardingByAccountNumberAndStatusIsFinished),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    controller = module.get<Observer>(Observer);
    configService = module.get(ConfigService);
    bankTedRepository = new BankTedDatabaseRepository();
    bankingTedRepository = new BankingTedDatabaseRepository();
    bankingTedReceivedRepository = new BankingTedReceivedDatabaseRepository();
    bankingContactRepository = new BankingContactDatabaseRepository();
    bankingAccountContactRepository =
      new BankingAccountContactDatabaseRepository();

    const authConfig: TopazioAuthGatewayConfig = {
      appEnv: configService.get<string>('APP_ENV'),
      baseUrl: configService.get<string>('APP_TOPAZIO_AUTH_BASE_URL'),
      clientId: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_ID'),
      clientSecret: configService.get<string>('APP_TOPAZIO_AUTH_CLIENT_SECRET'),
    };
    TopazioAuthGateway.build(authConfig);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandlePendingBankingTedEventViaTopazio', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should handle createdBankingTed send to PSP successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        const { id, userId, state } =
          await BankingTedFactory.create<BankingTedModel>(
            BankingTedModel.name,
            {
              state: BankingTedState.PENDING,
              beneficiaryBankCode: '237',
              userId: user.uuid,
            },
          );
        const wallet = await WalletFactory.create<WalletEntity>(
          WalletEntity.name,
        );

        const walletAccount =
          await WalletAccountFactory.create<WalletAccountEntity>(
            WalletAccountEntity.name,
            { state: WalletAccountState.ACTIVE },
          );

        mockCreateGateway.mockImplementationOnce(
          createBankingTedPspGatewayMock.success,
        );
        mockGetUserService.mockResolvedValue(user);
        mockGetWalletAccountByUserService.mockResolvedValue(walletAccount);

        const message: HandlePendingBankingTedEventRequest = {
          id,
          userId,
          state,
          walletId: wallet.uuid,
        };

        await controller.handlePendingBankingTedEventViaTopazio(
          message,
          bankingTedRepository,
          bankTedRepository,
          bankingTedReceivedRepository,
          bankingContactRepository,
          bankingAccountContactRepository,
          bankingTedEmitter,
          bankingTedReceivedEmitter,
          pspGateway,
          operationService,
          userService,
          logger,
          ctx,
        );

        expect(mockGetUserService).toHaveBeenCalledTimes(1);
        expect(mockCreateGateway).toHaveBeenCalledTimes(1);
        expect(mockGetWalletAccountByUserService).toHaveBeenCalledTimes(1);
        expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(1);
        expect(mockEmitBankingTedEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitBankingTedEvent.mock.calls[0][0]).toBe(
          BankingTedEventType.WAITING,
        );
      });

      it('TC0002 - Should handle createdBankingTed send to P2P successfully', async () => {
        const bankTed = await BankTedFactory.create<BankTedModel>(
          BankTedModel.name,
          { code: '82' },
        );
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        const { id, userId, state } =
          await BankingTedFactory.create<BankingTedModel>(
            BankingTedModel.name,
            {
              state: BankingTedState.PENDING,
              beneficiaryBankCode: bankTed.code,
              userId: user.uuid,
            },
          );

        const walletAccount =
          await WalletAccountFactory.create<WalletAccountEntity>(
            WalletAccountEntity.name,
            { state: WalletAccountState.ACTIVE },
          );

        const wallet = await WalletFactory.create<WalletEntity>(
          WalletEntity.name,
          { state: WalletState.ACTIVE },
        );

        const onboarding = await OnboardingFactory.create<OnboardingEntity>(
          OnboardingEntity.name,
        );

        mockCreateGateway.mockImplementationOnce(
          createBankingTedPspGatewayMock.success,
        );
        mockGetUserService.mockResolvedValue(user);
        mockGetWalletAccountByUserService.mockResolvedValue(walletAccount);
        mockGetUserOnboarding.mockResolvedValue(onboarding);
        mockGetDefaultUserWallet.mockResolvedValue(wallet);

        const message: HandlePendingBankingTedEventRequest = {
          id,
          userId,
          state,
          walletId: wallet.uuid,
        };

        await controller.handlePendingBankingTedEventViaTopazio(
          message,
          bankingTedRepository,
          bankTedRepository,
          bankingTedReceivedRepository,
          bankingContactRepository,
          bankingAccountContactRepository,
          bankingTedEmitter,
          bankingTedReceivedEmitter,
          pspGateway,
          operationService,
          userService,
          logger,
          ctx,
        );

        expect(mockGetUserService).toHaveBeenCalledTimes(2);
        expect(mockCreateGateway).toHaveBeenCalledTimes(0);
        expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(1);
        expect(mockEmitBankingTedEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitBankingTedEvent.mock.calls[0][0]).toBe(
          BankingTedEventType.CONFIRMED,
        );
        expect(mockEmitBankingTedReceivedEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitBankingTedReceivedEvent.mock.calls[0][0]).toBe(
          BankingTedReceivedEventType.RECEIVED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not handle pending if incorrect state', async () => {
        const { id, userId, state } =
          await BankingTedFactory.create<BankingTedModel>(
            BankingTedModel.name,
            { state: BankingTedState.FAILED },
          );

        const wallet = await WalletFactory.create<WalletEntity>(
          WalletEntity.name,
        );

        const message: HandlePendingBankingTedEventRequest = {
          id,
          userId,
          state,
          walletId: wallet.uuid,
        };

        await controller.handlePendingBankingTedEventViaTopazio(
          message,
          bankingTedRepository,
          bankTedRepository,
          bankingTedReceivedRepository,
          bankingContactRepository,
          bankingAccountContactRepository,
          bankingTedEmitter,
          bankingTedReceivedEmitter,
          pspGateway,
          operationService,
          userService,
          logger,
          ctx,
        );

        expect(mockCreateGateway).toHaveBeenCalledTimes(0);
        expect(mockEmitBankingTedEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
