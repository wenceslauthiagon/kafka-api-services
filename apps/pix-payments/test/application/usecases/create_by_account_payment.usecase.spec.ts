import { cpf } from 'cpf-cnpj-validator';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  MissingDataException,
  defaultLogger as logger,
  ForbiddenException,
  getMoment,
} from '@zro/common';
import {
  DecodedPixAccountEntity,
  DecodedPixAccountRepository,
  DecodedPixAccountState,
  PaymentEntity,
  PaymentPriorityType,
  PaymentRepository,
  PaymentState,
} from '@zro/pix-payments/domain';
import { OnboardingEntity, UserEntity } from '@zro/users/domain';
import {
  WalletAccountEntity,
  WalletAccountState,
  WalletEntity,
} from '@zro/operations/domain';
import { BankEntity } from '@zro/banking/domain';
import {
  CreateByAccountPaymentUseCase as UseCase,
  PaymentEventEmitter,
  UserService,
  OperationService,
  DecodedPixAccountEventEmitter,
  PaymentInvalidDateException,
  DecodedPixAccountNotFoundException,
  DecodedPixAccountInvalidStateException,
} from '@zro/pix-payments/application';
import { WalletAccountNotFoundException } from '@zro/operations/application';
import {
  OnboardingNotFoundException,
  UserNotFoundException,
} from '@zro/users/application';
import { WalletAccountFactory } from '@zro/test/operations/config';
import { PaymentFactory } from '@zro/test/pix-payments/config';

describe('CreatePaymentUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const currencyTag = 'REAL';
    const transactionTag = 'PIXSENDACC';
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

    const {
      paymentRepository,
      mockCreatePaymentRepository,
      mockGetPaymentRepository,
      decodedPixAccountRepository,
      mockGetDecodedPixAccountRepository,
      mockUpdateDecodedPixAccountRepository,
    } = mockRepository();
    const {
      paymentEmitter,
      mockPendingPaymentEvent,
      decodedPixAccountEmitter,
      mockConfirmedDecodedPixAccountEvent,
      mockSchedulePaymentEvent,
    } = mockEmitter();

    const sut = new UseCase(
      logger,
      paymentRepository,
      decodedPixAccountRepository,
      paymentEmitter,
      decodedPixAccountEmitter,
      userService,
      operationService,
      currencyTag,
      transactionTag,
    );
    return {
      sut,
      mockCreatePaymentRepository,
      mockGetPaymentRepository,
      mockPendingPaymentEvent,
      mockGetUserService,
      mockGetOnboardingService,
      mockGetOperationService,
      mockGetDecodedPixAccountRepository,
      mockUpdateDecodedPixAccountRepository,
      mockConfirmedDecodedPixAccountEvent,
      mockSchedulePaymentEvent,
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

    const decodedPixAccountRepository: DecodedPixAccountRepository =
      createMock<DecodedPixAccountRepository>();
    const mockGetDecodedPixAccountRepository: jest.Mock = On(
      decodedPixAccountRepository,
    ).get(method((mock) => mock.getById));
    const mockUpdateDecodedPixAccountRepository: jest.Mock = On(
      decodedPixAccountRepository,
    ).get(method((mock) => mock.update));

    return {
      paymentRepository,
      mockCreatePaymentRepository,
      mockGetPaymentRepository,
      decodedPixAccountRepository,
      mockGetDecodedPixAccountRepository,
      mockUpdateDecodedPixAccountRepository,
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

    const decodedPixAccountEmitter: DecodedPixAccountEventEmitter =
      createMock<DecodedPixAccountEventEmitter>();
    const mockConfirmedDecodedPixAccountEvent: jest.Mock = On(
      decodedPixAccountEmitter,
    ).get(method((mock) => mock.confirmedDecodedPixAccount));

    return {
      paymentEmitter,
      mockPendingPaymentEvent,
      decodedPixAccountEmitter,
      mockConfirmedDecodedPixAccountEvent,
      mockSchedulePaymentEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if missing params', async () => {
      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockPendingPaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedPixAccountRepository,
        mockUpdateDecodedPixAccountRepository,
        mockConfirmedDecodedPixAccountEvent,
        mockSchedulePaymentEvent,
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
              decodedPixAccount: new DecodedPixAccountEntity({
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
              decodedPixAccount: new DecodedPixAccountEntity({
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
              decodedPixAccount: new DecodedPixAccountEntity({}),
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
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmedDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if payment already exists', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const { id, decodedPixAccount, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixAccount,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockPendingPaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedPixAccountRepository,
        mockUpdateDecodedPixAccountRepository,
        mockConfirmedDecodedPixAccountEvent,
        mockSchedulePaymentEvent,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(payment);

      const result = await sut.execute(user, wallet, payment);
      expect(result).toBeDefined();
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmedDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if payment already exists and user is forbidden', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const { id, decodedPixAccount, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixAccount,
        value,
        description,
        wallet: new WalletEntity({ uuid: faker.datatype.uuid() }),
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockPendingPaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedPixAccountRepository,
        mockUpdateDecodedPixAccountRepository,
        mockConfirmedDecodedPixAccountEvent,
        mockSchedulePaymentEvent,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(payment);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(ForbiddenException);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmedDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if user not found', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const { id, decodedPixAccount, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixAccount,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockPendingPaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedPixAccountRepository,
        mockUpdateDecodedPixAccountRepository,
        mockConfirmedDecodedPixAccountEvent,
        mockSchedulePaymentEvent,
      } = makeSut();
      mockGetUserService.mockResolvedValue(undefined);
      mockGetPaymentRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(UserNotFoundException);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmedDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not create if user found but dont has cpf', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
        uuid: faker.datatype.uuid(),
        fullName: faker.name.fullName(),
      });
      const { id, decodedPixAccount, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixAccount,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockPendingPaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedPixAccountRepository,
        mockUpdateDecodedPixAccountRepository,
        mockConfirmedDecodedPixAccountEvent,
        mockSchedulePaymentEvent,
      } = makeSut();
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(undefined);
      mockGetPaymentRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmedDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not create if user found but dont has fullName', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
        uuid: faker.datatype.uuid(),
        fullName: faker.name.fullName(),
      });
      const { id, decodedPixAccount, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixAccount,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockPendingPaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedPixAccountRepository,
        mockUpdateDecodedPixAccountRepository,
        mockConfirmedDecodedPixAccountEvent,
        mockSchedulePaymentEvent,
      } = makeSut();
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(undefined);
      mockGetPaymentRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmedDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not create if onboarding not found', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
        uuid: faker.datatype.uuid(),
        document: cpf.generate(),
        fullName: faker.name.fullName(),
      });
      const { id, decodedPixAccount, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixAccount,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockPendingPaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedPixAccountRepository,
        mockUpdateDecodedPixAccountRepository,
        mockConfirmedDecodedPixAccountEvent,
        mockSchedulePaymentEvent,
      } = makeSut();
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(undefined);
      mockGetPaymentRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(OnboardingNotFoundException);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmedDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
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
      const { id, decodedPixAccount, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixAccount,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockPendingPaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedPixAccountRepository,
        mockUpdateDecodedPixAccountRepository,
        mockConfirmedDecodedPixAccountEvent,
        mockSchedulePaymentEvent,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(WalletAccountNotFoundException);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmedDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
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
      const { id, decodedPixAccount, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedPixAccount,
        value,
        description,
        paymentDate: getMoment().add(5, 'month').toDate(),
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockPendingPaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedPixAccountRepository,
        mockUpdateDecodedPixAccountRepository,
        mockConfirmedDecodedPixAccountEvent,
        mockSchedulePaymentEvent,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(PaymentInvalidDateException);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmedDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0010 - Should not create if decoded account is not found', async () => {
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
      const { decodedPixAccount, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id: faker.datatype.uuid(),
        decodedPixAccount,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockPendingPaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedPixAccountRepository,
        mockUpdateDecodedPixAccountRepository,
        mockConfirmedDecodedPixAccountEvent,
        mockSchedulePaymentEvent,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);
      mockGetDecodedPixAccountRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(
        DecodedPixAccountNotFoundException,
      );
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetDecodedPixAccountRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmedDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0011 - Should not create if decoded account is differ than PENDING', async () => {
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
      const { decodedPixAccount, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const decodedPixAccountValue = new DecodedPixAccountEntity({
        state: DecodedPixAccountState.CONFIRMED,
      });
      const payment = new PaymentEntity({
        id: faker.datatype.uuid(),
        decodedPixAccount,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockPendingPaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedPixAccountRepository,
        mockUpdateDecodedPixAccountRepository,
        mockConfirmedDecodedPixAccountEvent,
        mockSchedulePaymentEvent,
      } = makeSut();

      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);
      mockGetDecodedPixAccountRepository.mockResolvedValue(
        decodedPixAccountValue,
      );

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(
        DecodedPixAccountInvalidStateException,
      );
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetDecodedPixAccountRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDecodedPixAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmedDecodedPixAccountEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0012 - Should create successfully when paymentDate is for today', async () => {
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
      const { decodedPixAccount, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const decodedPixAccountValue = new DecodedPixAccountEntity({
        state: DecodedPixAccountState.PENDING,
        bank: new BankEntity({ ispb: '11111111' }),
      });
      const payment = new PaymentEntity({
        id: faker.datatype.uuid(),
        decodedPixAccount,
        value,
        paymentDate: null,
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockPendingPaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedPixAccountRepository,
        mockUpdateDecodedPixAccountRepository,
        mockConfirmedDecodedPixAccountEvent,
        mockSchedulePaymentEvent,
      } = makeSut();

      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);
      mockGetDecodedPixAccountRepository.mockResolvedValue(
        decodedPixAccountValue,
      );

      const result = await sut.execute(user, wallet, payment);

      expect(result).toBeDefined();
      expect(result.state).toBe(PaymentState.PENDING);
      expect(result.priorityType).toBe(PaymentPriorityType.PRIORITY);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(1);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetDecodedPixAccountRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDecodedPixAccountRepository).toHaveBeenCalledTimes(1);
      expect(mockConfirmedDecodedPixAccountEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0013 - Should create successfully when paymentDate is scheduled', async () => {
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
      const { decodedPixAccount, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const decodedPixAccountValue = new DecodedPixAccountEntity({
        state: DecodedPixAccountState.PENDING,
        bank: new BankEntity({ ispb: '11111111' }),
      });
      const payment = new PaymentEntity({
        id: faker.datatype.uuid(),
        decodedPixAccount,
        value,
        paymentDate: getMoment().add(5, 'day').toDate(),
        description,
        wallet,
      });

      const {
        sut,
        mockCreatePaymentRepository,
        mockGetPaymentRepository,
        mockPendingPaymentEvent,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedPixAccountRepository,
        mockUpdateDecodedPixAccountRepository,
        mockConfirmedDecodedPixAccountEvent,
        mockSchedulePaymentEvent,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);
      mockGetDecodedPixAccountRepository.mockResolvedValue(
        decodedPixAccountValue,
      );

      const result = await sut.execute(user, wallet, payment);

      expect(result).toBeDefined();
      expect(result.state).toBe(PaymentState.SCHEDULED);
      expect(result.priorityType).toBe(PaymentPriorityType.NOT_PRIORITY);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockSchedulePaymentEvent).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetDecodedPixAccountRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDecodedPixAccountRepository).toHaveBeenCalledTimes(1);
      expect(mockConfirmedDecodedPixAccountEvent).toHaveBeenCalledTimes(1);
    });
  });
});
