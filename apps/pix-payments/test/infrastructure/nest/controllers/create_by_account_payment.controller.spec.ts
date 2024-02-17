import { cpf } from 'cpf-cnpj-validator';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  defaultLogger as logger,
  ForbiddenException,
  getMoment,
} from '@zro/common';
import { OnboardingEntity, PersonType, UserEntity } from '@zro/users/domain';
import {
  DecodedPixAccountEntity,
  DecodedPixAccountState,
  PaymentState,
} from '@zro/pix-payments/domain';
import {
  WalletAccountEntity,
  WalletAccountState,
} from '@zro/operations/domain';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  CreateByAccountPaymentMicroserviceController as Controller,
  PaymentDatabaseRepository,
  PaymentModel,
  UserServiceKafka,
  OperationServiceKafka,
  DecodedPixAccountDatabaseRepository,
  DecodedPixAccountModel,
} from '@zro/pix-payments/infrastructure';
import {
  CreateByAccountPaymentRequest,
  DecodedPixAccountEventEmitterControllerInterface,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { PaymentInvalidDateException } from '@zro/pix-payments/application';
import { WalletAccountFactory } from '@zro/test/operations/config';
import {
  DecodedPixAccountFactory,
  PaymentFactory,
} from '@zro/test/pix-payments/config';

describe('CreateByAccountPaymentMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let paymentRepository: PaymentDatabaseRepository;
  let decodedPixAccountRepository: DecodedPixAccountDatabaseRepository;

  const paymentEmitter: PaymentEventEmitterControllerInterface =
    createMock<PaymentEventEmitterControllerInterface>();
  const mockEmitPaymentStaticEvent: jest.Mock = On(paymentEmitter).get(
    method((mock) => mock.emitPaymentEvent),
  );

  const decodedPixAccountEmitter: DecodedPixAccountEventEmitterControllerInterface =
    createMock<DecodedPixAccountEventEmitterControllerInterface>();
  const mockEmitDecodedPixAccountEvent: jest.Mock = On(
    decodedPixAccountEmitter,
  ).get(method((mock) => mock.emitDecodedPixAccountEvent));

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetOnboardingService: jest.Mock = On(userService).get(
    method((mock) => mock.getOnboardingByUserAndStatusIsFinished),
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

  describe('CreateByAccountPayment', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create by account pending successfully', async () => {
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          type: PersonType.NATURAL_PERSON,
          uuid: faker.datatype.uuid(),
          document: cpf.generate(),
          fullName: faker.name.fullName(),
        });
        const onboarding = new OnboardingEntity({
          fullName: faker.name.fullName(),
          accountNumber: faker.datatype
            .number(99999999)
            .toString()
            .padStart(8, '0'),
          branch: faker.datatype.number(9999).toString().padStart(4, '0'),
          updatedAt: faker.date.recent(9999),
        });
        const walletAccount =
          await WalletAccountFactory.create<WalletAccountEntity>(
            WalletAccountEntity.name,
            { state: WalletAccountState.ACTIVE },
          );
        const { value, description } =
          await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
            userId: user.uuid,
          });
        const decodedPixAccount =
          await DecodedPixAccountFactory.create<DecodedPixAccountModel>(
            DecodedPixAccountModel.name,
            {
              state: DecodedPixAccountState.PENDING,
              id: faker.datatype.uuid(),
            },
          );

        mockGetOnboardingService.mockResolvedValue(onboarding);
        mockGetUserService.mockResolvedValue(user);
        mockGetOperationService.mockResolvedValue(walletAccount);

        const message: CreateByAccountPaymentRequest = {
          id: faker.datatype.uuid(),
          walletId: faker.datatype.uuid(),
          value,
          decodedPixAccountId: decodedPixAccount.id,
          paymentDate: null,
          description,
          userId: user.uuid,
        };

        const result = await controller.execute(
          paymentRepository,
          decodedPixAccountRepository,
          paymentEmitter,
          decodedPixAccountEmitter,
          userService,
          operationService,
          logger,
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
        expect(mockEmitPaymentStaticEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPaymentStaticEvent.mock.calls[0][0]).toBe(
          PaymentState.PENDING,
        );
        expect(mockEmitDecodedPixAccountEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitDecodedPixAccountEvent.mock.calls[0][0]).toBe(
          PaymentState.CONFIRMED,
        );
      });

      it('TC0002 - Should create by account scheduled successfully', async () => {
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: faker.datatype.uuid(),
          type: PersonType.NATURAL_PERSON,
          document: cpf.generate(),
          fullName: faker.name.fullName(),
        });
        const onboarding = new OnboardingEntity({
          fullName: faker.name.fullName(),
          accountNumber: faker.datatype
            .number(99999999)
            .toString()
            .padStart(8, '0'),
          branch: faker.datatype.number(9999).toString().padStart(4, '0'),
          updatedAt: faker.date.recent(9999),
        });
        const walletAccount =
          await WalletAccountFactory.create<WalletAccountEntity>(
            WalletAccountEntity.name,
            { state: WalletAccountState.ACTIVE },
          );
        const { value, description } =
          await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
            userId: user.uuid,
          });
        const decodedPixAccount =
          await DecodedPixAccountFactory.create<DecodedPixAccountModel>(
            DecodedPixAccountModel.name,
            {
              state: DecodedPixAccountState.PENDING,
              id: faker.datatype.uuid(),
            },
          );

        mockGetOnboardingService.mockResolvedValue(onboarding);
        mockGetUserService.mockResolvedValue(user);
        mockGetOperationService.mockResolvedValue(walletAccount);

        const message: CreateByAccountPaymentRequest = {
          id: faker.datatype.uuid(),
          walletId: faker.datatype.uuid(),
          value,
          decodedPixAccountId: decodedPixAccount.id,
          paymentDate: getMoment().add(5, 'day').toDate(),
          description,
          userId: user.uuid,
        };

        const result = await controller.execute(
          paymentRepository,
          decodedPixAccountRepository,
          paymentEmitter,
          decodedPixAccountEmitter,
          userService,
          operationService,
          logger,
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
        expect(mockEmitPaymentStaticEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPaymentStaticEvent.mock.calls[0][0]).toBe(
          PaymentState.SCHEDULED,
        );
        expect(mockEmitDecodedPixAccountEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitDecodedPixAccountEvent.mock.calls[0][0]).toBe(
          PaymentState.CONFIRMED,
        );
      });

      describe('With invalid parameters', () => {
        it('TC0003 - should dont create payment when payment date is invalid', async () => {
          const user = new UserEntity({
            id: faker.datatype.number({ min: 1, max: 99999 }),
            uuid: faker.datatype.uuid(),
            type: PersonType.NATURAL_PERSON,
            document: cpf.generate(),
            fullName: faker.name.fullName(),
          });
          const onboarding = new OnboardingEntity({
            fullName: faker.name.fullName(),
            accountNumber: faker.datatype
              .number(99999999)
              .toString()
              .padStart(8, '0'),
            branch: faker.datatype.number(9999).toString().padStart(4, '0'),
            updatedAt: faker.date.recent(9999),
          });
          const walletAccount =
            await WalletAccountFactory.create<WalletAccountEntity>(
              WalletAccountEntity.name,
              { state: WalletAccountState.ACTIVE },
            );
          const decodedPixAccount = new DecodedPixAccountEntity({
            id: faker.datatype.uuid(),
          });
          const { value, description } =
            await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
              userId: user.uuid,
            });
          await DecodedPixAccountFactory.create<DecodedPixAccountModel>(
            DecodedPixAccountModel.name,
            {
              state: DecodedPixAccountState.PENDING,
              id: faker.datatype.uuid(),
            },
          );

          mockGetOnboardingService.mockResolvedValue(onboarding);
          mockGetUserService.mockResolvedValue(user);
          mockGetOperationService.mockResolvedValue(walletAccount);

          const message: CreateByAccountPaymentRequest = {
            id: faker.datatype.uuid(),
            walletId: faker.datatype.uuid(),
            value,
            decodedPixAccountId: decodedPixAccount.id,
            paymentDate: getMoment().add('4', 'month').toDate(),
            description,
            userId: user.uuid,
          };

          const testScript = () =>
            controller.execute(
              paymentRepository,
              decodedPixAccountRepository,
              paymentEmitter,
              decodedPixAccountEmitter,
              userService,
              operationService,
              logger,
              message,
              ctx,
            );

          await expect(testScript).rejects.toThrow(PaymentInvalidDateException);
          expect(mockEmitPaymentStaticEvent).toHaveBeenCalledTimes(0);
          expect(mockEmitDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
        });

        it('TC0004 - should dont create payment when user is forbidden', async () => {
          const user = new UserEntity({
            id: faker.datatype.number({ min: 1, max: 99999 }),
            uuid: faker.datatype.uuid(),
          });
          const decodedPixAccount = new DecodedPixAccountEntity({
            id: faker.datatype.uuid(),
          });
          const { id, value, description } =
            await PaymentFactory.create<PaymentModel>(PaymentModel.name);

          const message: CreateByAccountPaymentRequest = {
            id,
            walletId: faker.datatype.uuid(),
            value,
            decodedPixAccountId: decodedPixAccount.id,
            paymentDate: null,
            description,
            userId: user.uuid,
          };

          const testScript = () =>
            controller.execute(
              paymentRepository,
              decodedPixAccountRepository,
              paymentEmitter,
              decodedPixAccountEmitter,
              userService,
              operationService,
              logger,
              message,
              ctx,
            );

          await expect(testScript).rejects.toThrow(ForbiddenException);
          expect(mockEmitPaymentStaticEvent).toHaveBeenCalledTimes(0);
          expect(mockEmitDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
