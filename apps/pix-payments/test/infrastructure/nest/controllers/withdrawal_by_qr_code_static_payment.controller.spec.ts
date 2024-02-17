import { cpf } from 'cpf-cnpj-validator';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, ForbiddenException } from '@zro/common';
import { OnboardingEntity, PersonType, UserEntity } from '@zro/users/domain';
import {
  DecodedQrCodeEntity,
  DecodedQrCodeState,
  DecodedQrCodeType,
  PaymentState,
} from '@zro/pix-payments/domain';
import {
  WalletAccountEntity,
  WalletAccountState,
} from '@zro/operations/domain';
import { BankEntity } from '@zro/banking/domain';
import { PaymentValueIsNotPositiveException } from '@zro/pix-payments/application';
import {
  PaymentEventEmitterControllerInterface,
  WithdrawalByQrCodeStaticPaymentRequest,
} from '@zro/pix-payments/interface';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  WithdrawalByQrCodeStaticPaymentMicroserviceController as Controller,
  PaymentDatabaseRepository,
  PaymentModel,
  UserServiceKafka,
  OperationServiceKafka,
  DecodedQrCodeDatabaseRepository,
  DecodedQrCodeModel,
  BankingServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  DecodedQrCodeFactory,
  PaymentFactory,
} from '@zro/test/pix-payments/config';
import { WalletAccountFactory } from '@zro/test/operations/config';
import { KafkaContext } from '@nestjs/microservices';

describe('WithdrawalByQrCodeStaticPaymentMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let paymentRepository: PaymentDatabaseRepository;
  let decodedQrCodeRepository: DecodedQrCodeDatabaseRepository;

  const eventEmitter: PaymentEventEmitterControllerInterface =
    createMock<PaymentEventEmitterControllerInterface>();
  const mockEmitPaymentStaticEvent: jest.Mock = On(eventEmitter).get(
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

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    paymentRepository = new PaymentDatabaseRepository();
    decodedQrCodeRepository = new DecodedQrCodeDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('WithdrawalByQrCodeStaticPayment', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should withdrawal by qr code static pending successfully', async () => {
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
        const banking = new BankEntity({ ispb: '11111111' });
        const decodedQrCode = new DecodedQrCodeEntity({
          id: faker.datatype.uuid(),
          type: DecodedQrCodeType.QR_CODE_STATIC_WITHDRAWAL,
        });
        const { value, description } =
          await PaymentFactory.create<PaymentModel>(PaymentModel.name, {
            userId: user.uuid,
          });
        await DecodedQrCodeFactory.create<DecodedQrCodeModel>(
          DecodedQrCodeModel.name,
          {
            state: DecodedQrCodeState.READY,
            id: decodedQrCode.id,
          },
        );
        mockGetOnboardingService.mockResolvedValue(onboarding);
        mockGetUserService.mockResolvedValue(user);
        mockGetOperationService.mockResolvedValue(wallet);
        mockGetBankingService.mockResolvedValue(banking);

        const message: WithdrawalByQrCodeStaticPaymentRequest = {
          id: faker.datatype.uuid(),
          walletId: faker.datatype.uuid(),
          value,
          decodedQrCodeId: decodedQrCode.id,
          description,
          userId: user.uuid,
        };

        const result = await controller.execute(
          paymentRepository,
          decodedQrCodeRepository,
          eventEmitter,
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
    });

    describe('With invalid parameters', () => {
      it('TC0002 - should dont withdrawal payment when value is invalid', async () => {
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
        const wallet = await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );
        const decodedQrCode = new DecodedQrCodeEntity({
          id: faker.datatype.uuid(),
          type: DecodedQrCodeType.QR_CODE_STATIC_WITHDRAWAL,
        });
        const { description } = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
          { userId: user.uuid },
        );
        await DecodedQrCodeFactory.create<DecodedQrCodeModel>(
          DecodedQrCodeModel.name,
          {
            state: DecodedQrCodeState.READY,
            id: decodedQrCode.id,
            paymentValue: 0,
          },
        );
        mockGetOnboardingService.mockResolvedValue(onboarding);
        mockGetUserService.mockResolvedValue(user);
        mockGetOperationService.mockResolvedValue(wallet);

        const message: WithdrawalByQrCodeStaticPaymentRequest = {
          id: faker.datatype.uuid(),
          walletId: faker.datatype.uuid(),
          value: null,
          decodedQrCodeId: decodedQrCode.id,
          description,
          userId: user.uuid,
        };

        const testScript = () =>
          controller.execute(
            paymentRepository,
            decodedQrCodeRepository,
            eventEmitter,
            userService,
            operationService,
            bankingService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          PaymentValueIsNotPositiveException,
        );
        expect(mockEmitPaymentStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - should dont withdrawal payment when user is forbidden', async () => {
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          type: PersonType.NATURAL_PERSON,
          uuid: faker.datatype.uuid(),
        });
        const decodedQrCode = new DecodedQrCodeEntity({
          id: faker.datatype.uuid(),
        });
        const { id, value, description } =
          await PaymentFactory.create<PaymentModel>(PaymentModel.name);

        const message: WithdrawalByQrCodeStaticPaymentRequest = {
          id,
          walletId: faker.datatype.uuid(),
          value,
          decodedQrCodeId: decodedQrCode.id,
          description,
          userId: user.uuid,
        };

        const testScript = () =>
          controller.execute(
            paymentRepository,
            decodedQrCodeRepository,
            eventEmitter,
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
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
