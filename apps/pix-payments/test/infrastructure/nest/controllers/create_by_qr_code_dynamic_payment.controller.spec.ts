import { cpf } from 'cpf-cnpj-validator';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  defaultLogger as logger,
  ForbiddenException,
  getMoment,
} from '@zro/common';
import {
  WalletAccountEntity,
  WalletAccountState,
} from '@zro/operations/domain';
import { OnboardingEntity, PersonType, UserEntity } from '@zro/users/domain';
import {
  DecodedQrCodeState,
  DecodedQrCodeType,
  PaymentState,
} from '@zro/pix-payments/domain';
import {
  CreateByQrCodeDynamicPaymentMicroserviceController as Controller,
  PaymentDatabaseRepository,
  PaymentModel,
  UserServiceKafka,
  OperationServiceKafka,
  DecodedQrCodeDatabaseRepository,
  DecodedQrCodeModel,
} from '@zro/pix-payments/infrastructure';
import {
  CreateByQrCodeDynamicPaymentRequest,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  DecodedQrCodeFactory,
  PaymentFactory,
} from '@zro/test/pix-payments/config';
import { WalletAccountFactory } from '@zro/test/operations/config';
import { KafkaContext } from '@nestjs/microservices';

describe('CreateByQrCodeDynamicPaymentMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let paymentRepository: PaymentDatabaseRepository;
  let decodedQrCodeRepository: DecodedQrCodeDatabaseRepository;

  const eventEmitter: PaymentEventEmitterControllerInterface =
    createMock<PaymentEventEmitterControllerInterface>();
  const mockEmitPaymentDynamicEvent: jest.Mock = On(eventEmitter).get(
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

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    paymentRepository = new PaymentDatabaseRepository();
    decodedQrCodeRepository = new DecodedQrCodeDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateByQrCodeDynamicPayment', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create by qr code dynamic pending successfully', async () => {
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
        const decodedQrCode =
          await DecodedQrCodeFactory.create<DecodedQrCodeModel>(
            DecodedQrCodeModel.name,
            {
              state: DecodedQrCodeState.READY,
              userId: user.uuid,
              expirationDate: new Date(),
              type: DecodedQrCodeType.QR_CODE_DYNAMIC_INSTANT_PAYMENT,
            },
          );
        mockGetOnboardingService.mockResolvedValue(onboarding);
        mockGetUserService.mockResolvedValue(user);
        mockGetOperationService.mockResolvedValue(walletAccount);

        const message: CreateByQrCodeDynamicPaymentRequest = {
          id: faker.datatype.uuid(),
          walletId: faker.datatype.uuid(),
          value: faker.datatype.number({ min: 1, max: 99999 }),
          decodedQrCodeId: decodedQrCode.id,
          userId: user.uuid,
        };

        const result = await controller.execute(
          paymentRepository,
          decodedQrCodeRepository,
          eventEmitter,
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
        expect(result.value.createdAt).toBeDefined();
        expect(mockEmitPaymentDynamicEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPaymentDynamicEvent.mock.calls[0][0]).toBe(
          PaymentState.PENDING,
        );
      });

      it('TC0002 - Should create by qr code dynamic scheduled successfully', async () => {
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
        const wallet = await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

        const decodedQrCode =
          await DecodedQrCodeFactory.create<DecodedQrCodeModel>(
            DecodedQrCodeModel.name,
            {
              state: DecodedQrCodeState.READY,
              userId: user.uuid,
              expirationDate: new Date(),
              type: DecodedQrCodeType.QR_CODE_DYNAMIC_INSTANT_PAYMENT,
            },
          );
        mockGetOnboardingService.mockResolvedValue(onboarding);
        mockGetUserService.mockResolvedValue(user);
        mockGetOperationService.mockResolvedValue(wallet);

        const message: CreateByQrCodeDynamicPaymentRequest = {
          id: faker.datatype.uuid(),
          walletId: faker.datatype.uuid(),
          value: faker.datatype.number({ min: 1, max: 99999 }),
          decodedQrCodeId: decodedQrCode.id,
          userId: user.uuid,
          paymentDate: getMoment().add(5, 'day').toDate(),
        };

        const result = await controller.execute(
          paymentRepository,
          decodedQrCodeRepository,
          eventEmitter,
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
        expect(result.value.createdAt).toBeDefined();
        expect(mockEmitPaymentDynamicEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPaymentDynamicEvent.mock.calls[0][0]).toBe(
          PaymentState.SCHEDULED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - should dont create payment when user is forbidden', async () => {
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: faker.datatype.uuid(),
        });
        const { id, value } = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
        );

        const message: CreateByQrCodeDynamicPaymentRequest = {
          id,
          walletId: faker.datatype.uuid(),
          value,
          decodedQrCodeId: faker.datatype.uuid(),
          userId: user.uuid,
        };

        const testScript = () =>
          controller.execute(
            paymentRepository,
            decodedQrCodeRepository,
            eventEmitter,
            userService,
            operationService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(ForbiddenException);
        expect(mockEmitPaymentDynamicEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
