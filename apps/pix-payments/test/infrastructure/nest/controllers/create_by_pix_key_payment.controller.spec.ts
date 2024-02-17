import { cpf } from 'cpf-cnpj-validator';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  ForbiddenException,
  InvalidDataFormatException,
  getMoment,
} from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import { PaymentState } from '@zro/pix-payments/domain';
import {
  WalletAccountEntity,
  WalletAccountState,
} from '@zro/operations/domain';
import { DecodedPixKeyEntity, DecodedPixKeyState } from '@zro/pix-keys/domain';
import { OnboardingEntity, PersonType, UserEntity } from '@zro/users/domain';
import { PaymentInvalidDateException } from '@zro/pix-payments/application';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  CreateByPixKeyPaymentMicroserviceController as Controller,
  PaymentDatabaseRepository,
  PaymentModel,
  UserServiceKafka,
  OperationServiceKafka,
  BankingServiceKafka,
  PixKeyServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  CreateByPixKeyPaymentRequest,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { DecodedPixKeyFactory } from '@zro/test/pix-keys/config';
import { WalletAccountFactory } from '@zro/test/operations/config';
import { PaymentFactory } from '@zro/test/pix-payments/config';
import { KafkaContext } from '@nestjs/microservices';

describe('CreateByPixKeyPaymentMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let paymentRepository: PaymentDatabaseRepository;

  const paymentEmitter: PaymentEventEmitterControllerInterface =
    createMock<PaymentEventEmitterControllerInterface>();
  const mockEmitPaymentStaticEvent: jest.Mock = On(paymentEmitter).get(
    method((mock) => mock.emitPaymentEvent),
  );

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

  const bankingService: BankingServiceKafka = createMock<BankingServiceKafka>();
  const mockGetBankingService: jest.Mock = On(bankingService).get(
    method((mock) => mock.getBankByIspb),
  );

  const pixKeyService: PixKeyServiceKafka = createMock<PixKeyServiceKafka>();
  const mockGetByIdDecodedPixKeyService: jest.Mock = On(pixKeyService).get(
    method((mock) => mock.getDecodedPixKeyById),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    paymentRepository = new PaymentDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateByPixKeyPayment', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create by pix key pending successfully', async () => {
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
        const bank = new BankEntity({ name: 'TEST', ispb: 'TEST' });
        const { value, description } =
          await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
            userId: user.uuid,
          });
        const decodedPixKey =
          await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
            DecodedPixKeyEntity.name,
            { state: DecodedPixKeyState.PENDING, user },
          );
        mockGetOnboardingService.mockResolvedValue(onboarding);
        mockGetUserService.mockResolvedValue(user);
        mockGetOperationService.mockResolvedValue(walletAccount);
        mockGetByIdDecodedPixKeyService.mockResolvedValue(decodedPixKey);
        mockGetBankingService.mockResolvedValue(bank);

        const message: CreateByPixKeyPaymentRequest = {
          id: faker.datatype.uuid(),
          walletId: faker.datatype.uuid(),
          value,
          decodedPixKeyId: decodedPixKey.id,
          paymentDate: null,
          description,
          userId: user.uuid,
        };

        const result = await controller.execute(
          paymentRepository,
          paymentEmitter,
          pixKeyService,
          userService,
          operationService,
          bankingService,
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
      });

      it('TC0002 - Should create by pix key scheduled successfully', async () => {
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
        const bank = new BankEntity({ name: 'TEST', ispb: 'TEST' });
        const { value, description } =
          await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
            userId: user.uuid,
          });
        const decodedPixKey =
          await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
            DecodedPixKeyEntity.name,
            { state: DecodedPixKeyState.PENDING, user },
          );
        mockGetOnboardingService.mockResolvedValue(onboarding);
        mockGetUserService.mockResolvedValue(user);
        mockGetOperationService.mockResolvedValue(walletAccount);
        mockGetByIdDecodedPixKeyService.mockResolvedValue(decodedPixKey);
        mockGetBankingService.mockResolvedValue(bank);

        const message: CreateByPixKeyPaymentRequest = {
          id: faker.datatype.uuid(),
          walletId: faker.datatype.uuid(),
          value,
          decodedPixKeyId: decodedPixKey.id,
          paymentDate: getMoment().add(5, 'day').toDate(),
          description,
          userId: user.uuid,
        };

        const result = await controller.execute(
          paymentRepository,
          paymentEmitter,
          pixKeyService,
          userService,
          operationService,
          bankingService,
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
      });
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
        const { value, description } =
          await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
            userId: user.uuid,
          });
        const decodedPixKey =
          await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
            DecodedPixKeyEntity.name,
            { state: DecodedPixKeyState.PENDING },
          );
        mockGetOnboardingService.mockResolvedValue(onboarding);
        mockGetUserService.mockResolvedValue(user);
        mockGetOperationService.mockResolvedValue(walletAccount);

        const message: CreateByPixKeyPaymentRequest = {
          id: faker.datatype.uuid(),
          walletId: faker.datatype.uuid(),
          value,
          decodedPixKeyId: decodedPixKey.id,
          paymentDate: getMoment().add('4', 'month').toDate(),
          description,
          userId: user.uuid,
        };

        const testScript = () =>
          controller.execute(
            paymentRepository,
            paymentEmitter,
            pixKeyService,
            userService,
            operationService,
            bankingService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PaymentInvalidDateException);
        expect(mockEmitPaymentStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - should dont create payment when user is forbidden', async () => {
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: faker.datatype.uuid(),
        });
        const decodedPixKey = new DecodedPixKeyEntity({
          id: faker.datatype.uuid(),
        });
        const { id, value, description } =
          await PaymentFactory.create<PaymentModel>(PaymentModel.name);

        const message: CreateByPixKeyPaymentRequest = {
          id,
          walletId: faker.datatype.uuid(),
          value,
          decodedPixKeyId: decodedPixKey.id,
          paymentDate: null,
          description,
          userId: user.uuid,
        };

        const testScript = () =>
          controller.execute(
            paymentRepository,
            paymentEmitter,
            pixKeyService,
            userService,
            operationService,
            bankingService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(ForbiddenException);
        expect(mockEmitPaymentStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0005 - should be throw if value is greater than 1e18', async () => {
        const message: CreateByPixKeyPaymentRequest = {
          id: faker.datatype.uuid(),
          walletId: faker.datatype.uuid(),
          value: 1e19,
          decodedPixKeyId: faker.datatype.uuid(),
          paymentDate: getMoment().add('4', 'month').toDate(),
          description: 'dummy_description',
          userId: faker.datatype.uuid(),
        };

        const testScript = () =>
          controller.execute(
            paymentRepository,
            paymentEmitter,
            pixKeyService,
            userService,
            operationService,
            bankingService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
