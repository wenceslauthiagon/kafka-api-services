import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  defaultLogger as logger,
  getMoment,
  ForbiddenException,
} from '@zro/common';
import {
  OnboardingEntity,
  OnboardingStatus,
  PersonType,
  UserEntity,
} from '@zro/users/domain';
import {
  DecodedPixAccountEntity,
  PaymentEntity,
  PaymentState,
} from '@zro/pix-payments/domain';
import {
  WalletAccountEntity,
  WalletAccountState,
} from '@zro/operations/domain';
import { BankEntity } from '@zro/banking/domain';
import {
  CreateByAccountAndDecodedPaymentMicroserviceController as Controller,
  PaymentDatabaseRepository,
  UserServiceKafka,
  OperationServiceKafka,
  DecodedPixAccountDatabaseRepository,
  BankingServiceKafka,
  PaymentModel,
} from '@zro/pix-payments/infrastructure';
import {
  CreateByAccountAndDecodedPaymentRequest,
  DecodedPixAccountEventEmitterControllerInterface,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  BankNotFoundException,
  DecodedPixAccountOwnedByUserException,
  KycGateway,
  KYCNotFoundException,
  PaymentInvalidDateException,
} from '@zro/pix-payments/application';
import {
  DecodedPixAccountFactory,
  PaymentFactory,
} from '@zro/test/pix-payments/config';
import { WalletAccountFactory } from '@zro/test/operations/config';
import { BankFactory } from '@zro/test/banking/config';
import { OnboardingFactory, UserFactory } from '@zro/test/users/config';

describe('CreateByAccountAndDecodedPaymentMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let paymentRepository: PaymentDatabaseRepository;
  let decodedPixAccountRepository: DecodedPixAccountDatabaseRepository;

  const ZRO_BANK_ISPB = '26264220';

  const paymentEmitter: PaymentEventEmitterControllerInterface =
    createMock<PaymentEventEmitterControllerInterface>();
  const mockEmitPaymentEvent: jest.Mock = On(paymentEmitter).get(
    method((mock) => mock.emitPaymentEvent),
  );

  const decodedPixAccountEmitter: DecodedPixAccountEventEmitterControllerInterface =
    createMock<DecodedPixAccountEventEmitterControllerInterface>();
  const mockEmitDecodedPixAccountEvent: jest.Mock = On(
    decodedPixAccountEmitter,
  ).get(method((mock) => mock.emitDecodedPixAccountEvent));

  const kycGateway: KycGateway = createMock<KycGateway>();
  const mockGetKycInfoGateway: jest.Mock = On(kycGateway).get(
    method((mock) => mock.getKycInfo),
  );

  const bankingService: BankingServiceKafka = createMock<BankingServiceKafka>();
  const mockGetBankByIspbService: jest.Mock = On(bankingService).get(
    method((mock) => mock.getBankByIspb),
  );

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserByUuidService: jest.Mock = On(userService).get(
    method((mock) => mock.getOnboardingByUserAndStatusIsFinished),
  );

  const mockGetUserByCpfService: jest.Mock = On(userService).get(
    method((mock) => mock.getOnboardingByCpfAndStatusIsFinished),
  );
  const mockGetUserService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.getWalletAccountByWalletAndCurrency),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    paymentRepository = new PaymentDatabaseRepository();
    decodedPixAccountRepository = new DecodedPixAccountDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateByAccountAndDecodedPayment', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create and decoded by account pending successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        const onboarding = await OnboardingFactory.create<OnboardingEntity>(
          OnboardingEntity.name,
        );
        const bank = await BankFactory.create<BankEntity>(BankEntity.name);
        const walletAccount =
          await WalletAccountFactory.create<WalletAccountEntity>(
            WalletAccountEntity.name,
            { state: WalletAccountState.ACTIVE },
          );
        const { value, description } =
          await PaymentFactory.create<PaymentEntity>(PaymentEntity.name, {
            user,
          });
        const decoded =
          await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
            DecodedPixAccountEntity.name,
            { user },
          );

        mockGetBankByIspbService.mockResolvedValueOnce(bank);
        mockGetKycInfoGateway.mockResolvedValueOnce({
          name: 'any_name',
          props: {},
        });
        mockGetUserByUuidService.mockResolvedValue(onboarding);
        mockGetUserService.mockResolvedValue(user);
        mockGetOperationService.mockResolvedValue(walletAccount);

        const message: CreateByAccountAndDecodedPaymentRequest = {
          id: faker.datatype.uuid(),
          walletId: faker.datatype.uuid(),
          value,
          paymentDate: null,
          description,
          userId: user.uuid,
          personType: decoded.personType,
          bankIspb: decoded.bank.ispb,
          branch: decoded.branch,
          accountNumber: decoded.accountNumber,
          accountType: decoded.accountType,
          document: decoded.document,
        };

        const result = await controller.execute(
          logger,
          kycGateway,
          paymentRepository,
          decodedPixAccountRepository,
          paymentEmitter,
          decodedPixAccountEmitter,
          userService,
          bankingService,
          operationService,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.operationId).toBeDefined();
        expect(result.value.state).toBe(PaymentState.PENDING);
        expect(result.value.value).toBeDefined();
        expect(result.value.paymentDate).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPaymentEvent.mock.calls[0][0]).toBe(
          PaymentState.PENDING,
        );
        expect(mockEmitDecodedPixAccountEvent).toHaveBeenCalledTimes(2);
        expect(mockEmitDecodedPixAccountEvent.mock.calls[0][0]).toBe(
          PaymentState.PENDING,
        );
        expect(mockEmitDecodedPixAccountEvent.mock.calls[1][0]).toBe(
          PaymentState.CONFIRMED,
        );
      });

      it('TC0002 - Should create and decoded by account scheduled successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        const onboarding = await OnboardingFactory.create<OnboardingEntity>(
          OnboardingEntity.name,
        );
        const bank = await BankFactory.create<BankEntity>(BankEntity.name);
        const walletAccount =
          await WalletAccountFactory.create<WalletAccountEntity>(
            WalletAccountEntity.name,
            { state: WalletAccountState.ACTIVE },
          );
        const { value, description } =
          await PaymentFactory.create<PaymentEntity>(PaymentEntity.name, {
            user,
          });
        const decoded =
          await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
            DecodedPixAccountEntity.name,
            { user },
          );

        mockGetBankByIspbService.mockResolvedValueOnce(bank);
        mockGetKycInfoGateway.mockResolvedValueOnce({
          name: 'any_name',
          props: {},
        });
        mockGetUserByUuidService.mockResolvedValue(onboarding);
        mockGetUserService.mockResolvedValue(user);
        mockGetOperationService.mockResolvedValue(walletAccount);

        const message: CreateByAccountAndDecodedPaymentRequest = {
          id: faker.datatype.uuid(),
          walletId: faker.datatype.uuid(),
          value,
          paymentDate: getMoment().add(5, 'day').toDate(),
          description,
          userId: user.uuid,
          personType: decoded.personType,
          bankIspb: decoded.bank.ispb,
          branch: decoded.branch,
          accountNumber: decoded.accountNumber,
          accountType: decoded.accountType,
          document: decoded.document,
        };

        const result = await controller.execute(
          logger,
          kycGateway,
          paymentRepository,
          decodedPixAccountRepository,
          paymentEmitter,
          decodedPixAccountEmitter,
          userService,
          bankingService,
          operationService,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.operationId).toBeDefined();
        expect(result.value.state).toBe(PaymentState.SCHEDULED);
        expect(result.value.value).toBeDefined();
        expect(result.value.paymentDate).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
        expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPaymentEvent.mock.calls[0][0]).toBe(
          PaymentState.SCHEDULED,
        );
        expect(mockEmitDecodedPixAccountEvent).toHaveBeenCalledTimes(2);
        expect(mockEmitDecodedPixAccountEvent.mock.calls[0][0]).toBe(
          PaymentState.PENDING,
        );
        expect(mockEmitDecodedPixAccountEvent.mock.calls[1][0]).toBe(
          PaymentState.CONFIRMED,
        );
      });

      describe('With invalid parameters', () => {
        it('TC0003 - should not create decodedPixAccount if bank not found', async () => {
          const user = await UserFactory.create<UserEntity>(UserEntity.name);
          const bank = await BankFactory.create<BankEntity>(BankEntity.name);
          const decoded =
            await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
              DecodedPixAccountEntity.name,
              { user, bank },
            );
          const { value, description } =
            await PaymentFactory.create<PaymentEntity>(PaymentEntity.name, {
              user,
            });

          mockGetUserByUuidService.mockResolvedValueOnce(user);
          mockGetBankByIspbService.mockResolvedValueOnce(null);

          const message: CreateByAccountAndDecodedPaymentRequest = {
            id: faker.datatype.uuid(),
            walletId: faker.datatype.uuid(),
            value,
            paymentDate: getMoment().add(5, 'day').toDate(),
            description,
            userId: user.uuid,
            personType: decoded.personType,
            bankIspb: decoded.bank.ispb,
            branch: decoded.branch,
            accountNumber: decoded.accountNumber,
            accountType: decoded.accountType,
            document: decoded.document,
          };

          const testScript = () =>
            controller.execute(
              logger,
              kycGateway,
              paymentRepository,
              decodedPixAccountRepository,
              paymentEmitter,
              decodedPixAccountEmitter,
              userService,
              bankingService,
              operationService,
              message,
              ctx,
            );

          await expect(testScript).rejects.toThrow(BankNotFoundException);
          expect(mockEmitDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
          expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(0);
        });

        it('TC0004 - should not created decodedPixAccount if user decode self account', async () => {
          const user = await UserFactory.create<UserEntity>(UserEntity.name);
          const bank = await BankFactory.create<BankEntity>(BankEntity.name, {
            ispb: ZRO_BANK_ISPB,
          });
          const decoded =
            await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
              DecodedPixAccountEntity.name,
              { user, bank },
            );
          const { value, description } =
            await PaymentFactory.create<PaymentEntity>(PaymentEntity.name, {
              user,
            });

          mockGetUserByCpfService.mockResolvedValueOnce({
            id: faker.datatype.uuid(),
            user,
            status: OnboardingStatus.FINISHED,
            fullName: user.fullName,
          });
          mockGetBankByIspbService.mockResolvedValueOnce(bank);
          mockGetKycInfoGateway.mockResolvedValueOnce({
            name: 'any_name',
            props: {},
          });

          const message: CreateByAccountAndDecodedPaymentRequest = {
            id: faker.datatype.uuid(),
            walletId: faker.datatype.uuid(),
            value,
            paymentDate: getMoment().add(5, 'day').toDate(),
            description,
            userId: decoded.user.uuid,
            personType: PersonType.NATURAL_PERSON,
            bankIspb: decoded.bank.ispb,
            branch: decoded.branch,
            accountNumber: decoded.accountNumber,
            accountType: decoded.accountType,
            document: cpf.generate(),
          };

          const testScript = () =>
            controller.execute(
              logger,
              kycGateway,
              paymentRepository,
              decodedPixAccountRepository,
              paymentEmitter,
              decodedPixAccountEmitter,
              userService,
              bankingService,
              operationService,
              message,
              ctx,
            );

          await expect(testScript).rejects.toThrow(
            DecodedPixAccountOwnedByUserException,
          );
          expect(mockEmitDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
          expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(0);
        });

        it('TC0005 - should not created decodedPixAccount if KycInfo not found', async () => {
          const user = await UserFactory.create<UserEntity>(UserEntity.name);
          const bank = await BankFactory.create<BankEntity>(BankEntity.name);
          const decoded =
            await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
              DecodedPixAccountEntity.name,
              { bank },
            );
          const { value, description } =
            await PaymentFactory.create<PaymentEntity>(PaymentEntity.name, {
              user,
            });

          mockGetUserService.mockResolvedValue(user);
          mockGetUserByUuidService.mockResolvedValueOnce(null);
          mockGetBankByIspbService.mockResolvedValueOnce(bank);
          mockGetKycInfoGateway.mockResolvedValueOnce(null);

          const message: CreateByAccountAndDecodedPaymentRequest = {
            id: faker.datatype.uuid(),
            walletId: faker.datatype.uuid(),
            value,
            paymentDate: getMoment().add(5, 'day').toDate(),
            description,
            userId: user.uuid,
            personType: decoded.personType,
            bankIspb: decoded.bank.ispb,
            branch: decoded.branch,
            accountNumber: decoded.accountNumber,
            accountType: decoded.accountType,
            document: decoded.document,
          };

          const testScript = () =>
            controller.execute(
              logger,
              kycGateway,
              paymentRepository,
              decodedPixAccountRepository,
              paymentEmitter,
              decodedPixAccountEmitter,
              userService,
              bankingService,
              operationService,
              message,
              ctx,
            );

          await expect(testScript).rejects.toThrow(KYCNotFoundException);
          expect(mockEmitDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
          expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(0);
        });
        it('TC0006 - should not create payment when payment date is invalid', async () => {
          const user = await UserFactory.create<UserEntity>(UserEntity.name);
          const onboarding = await OnboardingFactory.create<OnboardingEntity>(
            OnboardingEntity.name,
          );
          const bank = await BankFactory.create<BankEntity>(BankEntity.name);
          const walletAccount =
            await WalletAccountFactory.create<WalletAccountEntity>(
              WalletAccountEntity.name,
              { state: WalletAccountState.ACTIVE },
            );
          const decoded =
            await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
              DecodedPixAccountEntity.name,
              { user },
            );
          const { value, description } =
            await PaymentFactory.create<PaymentEntity>(PaymentEntity.name, {
              user,
            });

          mockGetBankByIspbService.mockResolvedValueOnce(bank);
          mockGetKycInfoGateway.mockResolvedValueOnce({
            name: 'any_name',
            props: {},
          });
          mockGetUserByUuidService.mockResolvedValue(onboarding);
          mockGetUserService.mockResolvedValue(user);
          mockGetOperationService.mockResolvedValue(walletAccount);

          const message: CreateByAccountAndDecodedPaymentRequest = {
            id: faker.datatype.uuid(),
            walletId: faker.datatype.uuid(),
            value,
            paymentDate: getMoment().add(4, 'month').toDate(),
            description,
            userId: user.uuid,
            personType: decoded.personType,
            bankIspb: decoded.bank.ispb,
            branch: decoded.branch,
            accountNumber: decoded.accountNumber,
            accountType: decoded.accountType,
            document: decoded.document,
          };

          const testScript = () =>
            controller.execute(
              logger,
              kycGateway,
              paymentRepository,
              decodedPixAccountRepository,
              paymentEmitter,
              decodedPixAccountEmitter,
              userService,
              bankingService,
              operationService,
              message,
              ctx,
            );

          await expect(testScript).rejects.toThrow(PaymentInvalidDateException);
          expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(0);
          expect(mockEmitDecodedPixAccountEvent).toHaveBeenCalledTimes(1);
        });

        it('TC0007 - should not create payment when user is forbidden', async () => {
          const user = await UserFactory.create<UserEntity>(UserEntity.name);
          const bank = await BankFactory.create<BankEntity>(BankEntity.name);
          const decoded =
            await DecodedPixAccountFactory.create<DecodedPixAccountEntity>(
              DecodedPixAccountEntity.name,
              { user },
            );
          const { id, value, description } =
            await PaymentFactory.create<PaymentModel>(PaymentModel.name);

          mockGetBankByIspbService.mockResolvedValueOnce(bank);
          mockGetKycInfoGateway.mockResolvedValueOnce({
            name: 'any_name',
            props: {},
          });
          mockGetUserService.mockResolvedValue(user);

          const message: CreateByAccountAndDecodedPaymentRequest = {
            id,
            walletId: faker.datatype.uuid(),
            value,
            paymentDate: null,
            description,
            userId: user.uuid,
            personType: decoded.personType,
            bankIspb: decoded.bank.ispb,
            branch: decoded.branch,
            accountNumber: decoded.accountNumber,
            accountType: decoded.accountType,
            document: decoded.document,
          };
          const testScript = () =>
            controller.execute(
              logger,
              kycGateway,
              paymentRepository,
              decodedPixAccountRepository,
              paymentEmitter,
              decodedPixAccountEmitter,
              userService,
              bankingService,
              operationService,
              message,
              ctx,
            );

          await expect(testScript).rejects.toThrow(ForbiddenException);
          expect(mockEmitPaymentEvent).toHaveBeenCalledTimes(0);
          expect(mockEmitDecodedPixAccountEvent).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
