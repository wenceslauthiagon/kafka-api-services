import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { cpf } from 'cpf-cnpj-validator';
import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  MissingDataException,
  defaultLogger as logger,
  ForbiddenException,
  getMoment,
} from '@zro/common';
import {
  PaymentEntity,
  PaymentPriorityType,
  PaymentRepository,
  PaymentState,
} from '@zro/pix-payments/domain';
import {
  WalletAccountEntity,
  WalletAccountState,
  WalletEntity,
} from '@zro/operations/domain';
import { DecodedPixKeyEntity, DecodedPixKeyState } from '@zro/pix-keys/domain';
import { BankEntity } from '@zro/banking/domain';
import { OnboardingEntity, UserEntity } from '@zro/users/domain';
import {
  CreateByPixKeyPaymentUseCase as UseCase,
  PaymentEventEmitter,
  UserService,
  OperationService,
  PaymentInvalidDateException,
  BankingService,
  BankNotFoundException,
  PixKeyService,
} from '@zro/pix-payments/application';
import {
  OnboardingNotFoundException,
  UserNotFoundException,
} from '@zro/users/application';
import { WalletAccountNotFoundException } from '@zro/operations/application';
import {
  DecodedPixKeyNotFoundException,
  DecodedPixKeyInvalidStateException,
} from '@zro/pix-keys/application';
import { WalletAccountFactory } from '@zro/test/operations/config';
import { PaymentFactory } from '@zro/test/pix-payments/config';

describe('CreateByPixKeyPaymentUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const currencyTag = 'REAL';
    const transactionTag = 'PIXSENDKEY';
    const userService: UserService = createMock<UserService>();
    const mockGetUserService: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByUuid),
    );
    const mockGetOnboardingService: jest.Mock = On(userService).get(
      method((mock) => mock.getOnboardingByUserAndStatusIsFinished),
    );
    const operationService: OperationService = createMock<OperationService>();
    const mockGetOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.getWalletAccountByWalletAndCurrency),
    );

    const bankingService: BankingService = createMock<BankingService>();
    const mockGetBankingService: jest.Mock = On(bankingService).get(
      method((mock) => mock.getBankByIspb),
    );

    const pixKeyService: PixKeyService = createMock<PixKeyService>();
    const mockGetByIdDecodedPixKeyService: jest.Mock = On(pixKeyService).get(
      method((mock) => mock.getDecodedPixKeyById),
    );
    const mockUpdateStateDecodedPixKeyService: jest.Mock = On(
      pixKeyService,
    ).get(method((mock) => mock.updateDecodedPixKeyStateById));

    const {
      paymentRepository,
      mockCreatePaymentRepository,
      mockGetPaymentRepository,
    } = mockRepository();
    const {
      paymentEmitter,
      mockPendingPaymentEvent,
      mockSchedulePaymentEvent,
    } = mockEmitter();

    const sut = new UseCase(
      logger,
      paymentRepository,
      paymentEmitter,
      pixKeyService,
      userService,
      operationService,
      bankingService,
      currencyTag,
      transactionTag,
    );
    return {
      sut,
      mockCreatePaymentRepository,
      mockGetPaymentRepository,
      mockUpdateStateDecodedPixKeyService,
      mockGetByIdDecodedPixKeyService,
      mockPendingPaymentEvent,
      mockSchedulePaymentEvent,
      mockGetUserService,
      mockGetOnboardingService,
      mockGetOperationService,
      mockGetBankingService,
    };
  };

  const mockRepository = () => {
    const paymentRepository: PaymentRepository =
      createMock<PaymentRepository>();
    const mockCreatePaymentRepository: jest.Mock = On(paymentRepository).get(
      method((mock) => mock.create),
    );
    const mockGetPaymentRepository: jest.Mock = On(paymentRepository).get(
      method((mock) => mock.getById),
    );

    return {
      paymentRepository,
      mockCreatePaymentRepository,
      mockGetPaymentRepository,
    };
  };

  const mockEmitter = () => {
    const paymentEmitter: PaymentEventEmitter =
      createMock<PaymentEventEmitter>();
    const mockPendingPaymentEvent: jest.Mock = On(paymentEmitter).get(
      method((mock) => mock.pendingPayment),
    );
    const mockSchedulePaymentEvent: jest.Mock = On(paymentEmitter).get(
      method((mock) => mock.scheduledPayment),
    );

    return {
      paymentEmitter,
      mockPendingPaymentEvent,
      mockSchedulePaymentEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if missing params', async () => {
      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockUpdateStateDecodedPixKeyService,
        mockGetByIdDecodedPixKeyService,
        mockPendingPaymentEvent,
        mockSchedulePaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
      } = makeSut();

      const test = [
        () => sut.execute(null, null, null),
        () =>
          sut.execute(
            new UserEntity({ uuid: faker.datatype.uuid() }),
            null,
            null,
          ),
        () =>
          sut.execute(
            new UserEntity({ uuid: faker.datatype.uuid() }),
            null,
            new PaymentEntity({
              value: 100,
              decodedPixKey: new DecodedPixKeyEntity({
                id: faker.datatype.uuid(),
              }),
            }),
          ),
        () =>
          sut.execute(
            new UserEntity({ uuid: faker.datatype.uuid() }),
            null,
            new PaymentEntity({
              id: faker.datatype.uuid(),
              decodedPixKey: new DecodedPixKeyEntity({
                id: faker.datatype.uuid(),
              }),
            }),
          ),
        () =>
          sut.execute(
            new UserEntity({ uuid: faker.datatype.uuid() }),
            null,
            new PaymentEntity({
              id: faker.datatype.uuid(),
              value: 100,
              decodedPixKey: new DecodedPixKeyEntity({}),
            }),
          ),
        () =>
          sut.execute(
            new UserEntity({ uuid: faker.datatype.uuid() }),
            null,
            new PaymentEntity({
              id: faker.datatype.uuid(),
              value: 100,
            }),
          ),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateStateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if payment already exists', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const { id, decodedPixKey, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixKey,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockUpdateStateDecodedPixKeyService,
        mockGetByIdDecodedPixKeyService,
        mockPendingPaymentEvent,
        mockSchedulePaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(payment);

      const result = await sut.execute(user, wallet, payment);
      expect(result).toBeDefined();
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateStateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if payment already exists and user is forbidden', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const { id, decodedPixKey, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixKey,
        value,
        description,
        wallet: new WalletEntity({ uuid: faker.datatype.uuid() }),
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockUpdateStateDecodedPixKeyService,
        mockGetByIdDecodedPixKeyService,
        mockPendingPaymentEvent,
        mockSchedulePaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(payment);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(ForbiddenException);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateStateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if user not found', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const { id, decodedPixKey, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixKey,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockUpdateStateDecodedPixKeyService,
        mockGetByIdDecodedPixKeyService,
        mockPendingPaymentEvent,
        mockSchedulePaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
      } = makeSut();
      mockGetUserService.mockResolvedValue(undefined);
      mockGetPaymentRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(UserNotFoundException);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateStateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not create if user found but dont has cpf', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
        uuid: faker.datatype.uuid(),
        fullName: faker.name.fullName(),
      });
      const { id, decodedPixKey, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixKey,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockUpdateStateDecodedPixKeyService,
        mockGetByIdDecodedPixKeyService,
        mockPendingPaymentEvent,
        mockSchedulePaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
      } = makeSut();
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(undefined);
      mockGetPaymentRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateStateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not create if user found but dont has fullName', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
        uuid: faker.datatype.uuid(),
        fullName: faker.name.fullName(),
      });
      const { id, decodedPixKey, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixKey,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockUpdateStateDecodedPixKeyService,
        mockGetByIdDecodedPixKeyService,
        mockPendingPaymentEvent,
        mockSchedulePaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
      } = makeSut();
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(undefined);
      mockGetPaymentRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateStateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not create if onboarding not found', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
        uuid: faker.datatype.uuid(),
        document: cpf.generate(),
        fullName: faker.name.fullName(),
      });
      const { id, decodedPixKey, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixKey,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockUpdateStateDecodedPixKeyService,
        mockGetByIdDecodedPixKeyService,
        mockPendingPaymentEvent,
        mockSchedulePaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
      } = makeSut();
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(undefined);
      mockGetPaymentRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(OnboardingNotFoundException);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateStateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should not create if owner user wallet not found', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
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
      const { id, decodedPixKey, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixKey,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockUpdateStateDecodedPixKeyService,
        mockGetByIdDecodedPixKeyService,
        mockPendingPaymentEvent,
        mockSchedulePaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(WalletAccountNotFoundException);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateStateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
    });

    it('TC0009 - Should not create if payment date is invalid (not for today neither scheduled)', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
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
      const { id, decodedPixKey, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixKey,
        value,
        description,
        paymentDate: getMoment().add(5, 'month').toDate(),
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockUpdateStateDecodedPixKeyService,
        mockGetByIdDecodedPixKeyService,
        mockPendingPaymentEvent,
        mockSchedulePaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(PaymentInvalidDateException);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateStateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
    });

    it('TC0010 - Should not create if decoded pix key is not found', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
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
      const { decodedPixKey, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id: faker.datatype.uuid(),
        decodedPixKey,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockUpdateStateDecodedPixKeyService,
        mockGetByIdDecodedPixKeyService,
        mockPendingPaymentEvent,
        mockSchedulePaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);
      mockGetByIdDecodedPixKeyService.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(DecodedPixKeyNotFoundException);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateStateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDecodedPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
    });

    it('TC0011 - Should not create if decoded pix key is differ than PENDING', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
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
      const { decodedPixKey, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const decodedPixKeyValue = new DecodedPixKeyEntity({
        state: DecodedPixKeyState.CONFIRMED,
      });
      const payment = new PaymentEntity({
        id: faker.datatype.uuid(),
        decodedPixKey,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockUpdateStateDecodedPixKeyService,
        mockGetByIdDecodedPixKeyService,
        mockPendingPaymentEvent,
        mockSchedulePaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);
      mockGetByIdDecodedPixKeyService.mockResolvedValue(decodedPixKeyValue);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(
        DecodedPixKeyInvalidStateException,
      );
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateStateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDecodedPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
    });

    it('TC0012 - Should not create if decoded pix key is differ than PENDING', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
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
      const { decodedPixKey, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const decodedPixKeyValue = new DecodedPixKeyEntity({
        state: DecodedPixKeyState.PENDING,
      });
      const payment = new PaymentEntity({
        id: faker.datatype.uuid(),
        decodedPixKey,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockUpdateStateDecodedPixKeyService,
        mockGetByIdDecodedPixKeyService,
        mockPendingPaymentEvent,
        mockSchedulePaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetBankingService,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);
      mockGetByIdDecodedPixKeyService.mockResolvedValue(decodedPixKeyValue);
      mockGetBankingService.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(BankNotFoundException);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateStateDecodedPixKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetByIdDecodedPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0013 - Should create successfully when paymentDate is for today', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
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
      const { decodedPixKey, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const decodedPixKeyValue = new DecodedPixKeyEntity({
        state: DecodedPixKeyState.PENDING,
      });
      const payment = new PaymentEntity({
        id: faker.datatype.uuid(),
        decodedPixKey,
        value,
        paymentDate: null,
        description,
        wallet,
      });
      const bank = new BankEntity({ name: 'TEST', ispb: 'TEST' });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockUpdateStateDecodedPixKeyService,
        mockGetByIdDecodedPixKeyService,
        mockPendingPaymentEvent,
        mockSchedulePaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetBankingService,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);
      mockGetByIdDecodedPixKeyService.mockResolvedValue(decodedPixKeyValue);
      mockGetBankingService.mockResolvedValue(bank);

      const result = await sut.execute(user, wallet, payment);

      expect(result).toBeDefined();
      expect(result.state).toBe(PaymentState.PENDING);
      expect(result.priorityType).toBe(PaymentPriorityType.PRIORITY);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateStateDecodedPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDecodedPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(1);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
    });

    it('TC0014 - Should create successfully when paymentDate is scheduled', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
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
      const bank = new BankEntity({
        name: 'TEST',
        ispb: 'TEST',
      });
      const { decodedPixKey, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const decodedPixKeyValue = new DecodedPixKeyEntity({
        state: DecodedPixKeyState.PENDING,
      });
      const payment = new PaymentEntity({
        id: faker.datatype.uuid(),
        decodedPixKey,
        value,
        paymentDate: getMoment().add(5, 'day').toDate(),
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockUpdateStateDecodedPixKeyService,
        mockGetByIdDecodedPixKeyService,
        mockPendingPaymentEvent,
        mockSchedulePaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetBankingService,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);
      mockGetByIdDecodedPixKeyService.mockResolvedValue(decodedPixKeyValue);
      mockGetBankingService.mockResolvedValue(bank);

      const result = await sut.execute(user, wallet, payment);

      expect(result).toBeDefined();
      expect(result.state).toBe(PaymentState.SCHEDULED);
      expect(result.priorityType).toBe(PaymentPriorityType.NOT_PRIORITY);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateStateDecodedPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDecodedPixKeyService).toHaveBeenCalledTimes(1);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
    });
  });
});
