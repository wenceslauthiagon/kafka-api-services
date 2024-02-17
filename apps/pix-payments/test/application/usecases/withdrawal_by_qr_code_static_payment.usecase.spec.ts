import { cpf } from 'cpf-cnpj-validator';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  MissingDataException,
  defaultLogger as logger,
  ForbiddenException,
} from '@zro/common';
import {
  DecodedQrCodeEntity,
  DecodedQrCodeRepository,
  DecodedQrCodeState,
  DecodedQrCodeType,
  PaymentEntity,
  PaymentPriorityType,
  PaymentRepository,
  PaymentState,
  PaymentType,
} from '@zro/pix-payments/domain';
import { OnboardingEntity, UserEntity } from '@zro/users/domain';
import {
  WalletAccountEntity,
  WalletAccountState,
  WalletEntity,
} from '@zro/operations/domain';
import {
  OnboardingNotFoundException,
  UserNotFoundException,
} from '@zro/users/application';
import {
  WithdrawalByQrCodeStaticPaymentUseCase as UseCase,
  PaymentEventEmitter,
  UserService,
  OperationService,
  DecodedQrCodeNotFoundException,
  DecodedQrCodeInvalidStateException,
  BankingService,
  BankNotFoundException,
  PaymentValueIsNotPositiveException,
} from '@zro/pix-payments/application';
import { WalletAccountNotFoundException } from '@zro/operations/application';
import { WalletAccountFactory } from '@zro/test/operations/config';
import { PaymentFactory } from '@zro/test/pix-payments/config';

describe('WithdrawalPaymentUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const currencyTag = 'REAL';
    const transactionTag = 'PIXWITHDRAWALQRS';
    const agentModWithdrawal = 'AGTEC';
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

    const {
      paymentRepository,
      mockCreatePaymentRepository,
      mockGetPaymentRepository,
      decodedQrCodeRepository,
      mockGetDecodedQrCodeRepository,
    } = mockRepository();
    const { eventEmitter, mockPendingPaymentEvent } = mockEmitter();

    const sut = new UseCase(
      logger,
      paymentRepository,
      decodedQrCodeRepository,
      eventEmitter,
      userService,
      operationService,
      bankingService,
      currencyTag,
      transactionTag,
      agentModWithdrawal,
    );
    return {
      sut,
      transactionTag,
      mockCreatePaymentRepository,
      mockGetPaymentRepository,
      mockPendingPaymentEvent,
      mockGetUserService,
      mockGetOnboardingService,
      mockGetOperationService,
      mockGetDecodedQrCodeRepository,
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

    const decodedQrCodeRepository: DecodedQrCodeRepository =
      createMock<DecodedQrCodeRepository>();
    const mockGetDecodedQrCodeRepository: jest.Mock = On(
      decodedQrCodeRepository,
    ).get(method((mock) => mock.getById));

    return {
      paymentRepository,
      mockCreatePaymentRepository,
      mockGetPaymentRepository,
      decodedQrCodeRepository,
      mockGetDecodedQrCodeRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: PaymentEventEmitter = createMock<PaymentEventEmitter>();
    const mockPendingPaymentEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.pendingPayment),
    );

    return {
      eventEmitter,
      mockPendingPaymentEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if missing params', async () => {
      const {
        sut,
        mockPendingPaymentEvent,
        mockGetPaymentRepository,
        mockCreatePaymentRepository,
      } = makeSut();

      const testScript = () => sut.execute(null, null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if payment already exists', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const { id, decodedQrCode, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedQrCode,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockPendingPaymentEvent,
        mockGetPaymentRepository,
        mockCreatePaymentRepository,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(payment);

      const result = await sut.execute(user, wallet, payment);

      expect(result).toBeDefined();
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if payment already exists and wallet is forbidden', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const { id, decodedQrCode, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedQrCode,
        value,
        description,
        wallet: new WalletEntity({ uuid: faker.datatype.uuid() }),
      });

      const {
        sut,
        mockPendingPaymentEvent,
        mockGetPaymentRepository,
        mockCreatePaymentRepository,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(payment);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(ForbiddenException);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if user not found', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const { id, decodedQrCode, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedQrCode,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockPendingPaymentEvent,
        mockGetPaymentRepository,
        mockCreatePaymentRepository,
        mockGetUserService,
      } = makeSut();
      mockGetUserService.mockResolvedValue(undefined);
      mockGetPaymentRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(UserNotFoundException);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not create if user found but dont has cpf', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
        uuid: faker.datatype.uuid(),
        fullName: faker.name.fullName(),
      });
      const { id, decodedQrCode, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedQrCode,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockPendingPaymentEvent,
        mockGetPaymentRepository,
        mockCreatePaymentRepository,
        mockGetUserService,
        mockGetOnboardingService,
      } = makeSut();
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(undefined);
      mockGetPaymentRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not create if user found but dont has fullName', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
        uuid: faker.datatype.uuid(),
        fullName: faker.name.fullName(),
      });
      const { id, decodedQrCode, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedQrCode,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockPendingPaymentEvent,
        mockGetPaymentRepository,
        mockCreatePaymentRepository,
        mockGetUserService,
        mockGetOnboardingService,
      } = makeSut();
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(undefined);
      mockGetPaymentRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not create if onboarding not found', async () => {
      const user = new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
        uuid: faker.datatype.uuid(),
        document: cpf.generate(),
        fullName: faker.name.fullName(),
      });
      const { id, decodedQrCode, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id,
        decodedQrCode,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockPendingPaymentEvent,
        mockGetPaymentRepository,
        mockCreatePaymentRepository,
        mockGetUserService,
        mockGetOnboardingService,
      } = makeSut();
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(undefined);
      mockGetPaymentRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(OnboardingNotFoundException);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
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
      const { id, decodedQrCode, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);
      const payment = new PaymentEntity({
        id,
        decodedQrCode,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockPendingPaymentEvent,
        mockGetPaymentRepository,
        mockCreatePaymentRepository,
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
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
    });

    it('TC0009 - Should not create if decoded qr code is not found', async () => {
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
      const { decodedQrCode, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id: faker.datatype.uuid(),
        decodedQrCode,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockPendingPaymentEvent,
        mockGetPaymentRepository,
        mockCreatePaymentRepository,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedQrCodeRepository,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);
      mockGetDecodedQrCodeRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(DecodedQrCodeNotFoundException);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetDecodedQrCodeRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0010 - Should not create if decoded qr code is differ than READY', async () => {
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
      const decodedQrCodeValue = new DecodedQrCodeEntity({
        state: DecodedQrCodeState.PENDING,
      });
      const { value, decodedQrCode, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id: faker.datatype.uuid(),
        decodedQrCode,
        value,
        description,
        wallet,
      });

      const {
        sut,
        mockPendingPaymentEvent,
        mockGetPaymentRepository,
        mockCreatePaymentRepository,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedQrCodeRepository,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);
      mockGetDecodedQrCodeRepository.mockResolvedValue(decodedQrCodeValue);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(
        DecodedQrCodeInvalidStateException,
      );
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetDecodedQrCodeRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0011 - Should not create if decoded qr code dont has value neither payment', async () => {
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
      const decodedQrCodeValue = new DecodedQrCodeEntity({
        state: DecodedQrCodeState.READY,
        type: DecodedQrCodeType.QR_CODE_STATIC_WITHDRAWAL,
      });
      const { decodedQrCode, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id: faker.datatype.uuid(),
        decodedQrCode,
        value: 0,
        description,
        wallet,
      });

      const {
        sut,
        mockPendingPaymentEvent,
        mockGetPaymentRepository,
        mockCreatePaymentRepository,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedQrCodeRepository,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);
      mockGetDecodedQrCodeRepository.mockResolvedValue(decodedQrCodeValue);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(
        PaymentValueIsNotPositiveException,
      );
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetDecodedQrCodeRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0012 - Should not create if pss is not a valid ispb', async () => {
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
      const decodedQrCodeValue = new DecodedQrCodeEntity({
        state: DecodedQrCodeState.READY,
        pss: '11111111',
        type: DecodedQrCodeType.QR_CODE_STATIC_WITHDRAWAL,
      });
      const { decodedQrCode, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id: faker.datatype.uuid(),
        decodedQrCode,
        value: 15,
        description,
        wallet,
      });

      const {
        sut,
        mockPendingPaymentEvent,
        mockGetPaymentRepository,
        mockCreatePaymentRepository,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedQrCodeRepository,
        mockGetBankingService,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);
      mockGetDecodedQrCodeRepository.mockResolvedValue(decodedQrCodeValue);
      mockGetBankingService.mockResolvedValue(undefined);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(BankNotFoundException);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetDecodedQrCodeRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
    });

    it('TC0013 - Should not create if no exists pss', async () => {
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
      const decodedQrCodeValue = new DecodedQrCodeEntity({
        state: DecodedQrCodeState.READY,
        type: DecodedQrCodeType.QR_CODE_STATIC_WITHDRAWAL,
      });
      const { decodedQrCode, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id: faker.datatype.uuid(),
        decodedQrCode,
        value: 0,
        description,
        wallet,
      });

      const {
        sut,
        mockPendingPaymentEvent,
        mockGetPaymentRepository,
        mockCreatePaymentRepository,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedQrCodeRepository,
        mockGetBankingService,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);
      mockGetDecodedQrCodeRepository.mockResolvedValue(decodedQrCodeValue);

      const testScript = () => sut.execute(user, wallet, payment);

      await expect(testScript).rejects.toThrow(
        PaymentValueIsNotPositiveException,
      );
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetDecodedQrCodeRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0014 - Should create successfully', async () => {
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
      const decodedQrCodeValue = new DecodedQrCodeEntity({
        state: DecodedQrCodeState.READY,
        paymentValue: 1200,
        pss: '111111111',
        type: DecodedQrCodeType.QR_CODE_STATIC_WITHDRAWAL,
      });
      const { decodedQrCode, value, description, wallet } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const payment = new PaymentEntity({
        id: faker.datatype.uuid(),
        decodedQrCode,
        value,
        description,
        wallet,
      });

      const {
        sut,
        transactionTag,
        mockPendingPaymentEvent,
        mockGetPaymentRepository,
        mockCreatePaymentRepository,
        mockGetUserService,
        mockGetOnboardingService,
        mockGetOperationService,
        mockGetDecodedQrCodeRepository,
      } = makeSut();
      mockGetPaymentRepository.mockResolvedValue(undefined);
      mockGetUserService.mockResolvedValue(user);
      mockGetOnboardingService.mockResolvedValue(onboarding);
      mockGetOperationService.mockResolvedValue(walletAccount);
      mockGetDecodedQrCodeRepository.mockResolvedValue(decodedQrCodeValue);

      const result = await sut.execute(user, wallet, payment);

      expect(result).toBeDefined();
      expect(result.operation.id).toBeDefined();
      expect(result.state).toBe(PaymentState.PENDING);
      expect(result.paymentType).toBe(PaymentType.QR_CODE_STATIC_WITHDRAWAL);
      expect(result.priorityType).toBe(PaymentPriorityType.PRIORITY);
      expect(result.transactionTag).toBe(transactionTag);
      expect(mockPendingPaymentEvent).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetDecodedQrCodeRepository).toHaveBeenCalledTimes(1);
    });
  });
});
