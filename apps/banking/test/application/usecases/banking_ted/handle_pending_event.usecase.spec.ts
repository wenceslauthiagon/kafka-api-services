import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { OnboardingEntity, UserEntity } from '@zro/users/domain';
import {
  WalletAccountEntity,
  WalletAccountState,
  WalletEntity,
  WalletState,
} from '@zro/operations/domain';
import {
  BankingTedReceivedRepository,
  BankTedEntity,
  BankTedRepository,
  BankingTedEntity,
  BankingTedRepository,
  BankingTedState,
  BankingContactRepository,
  BankingAccountContactRepository,
} from '@zro/banking/domain';
import {
  HandlePendingBankingTedEventUseCase as UseCase,
  BankingTedGateway,
  BankingTedEventEmitter,
  OperationService,
  BankingTedInvalidStateException,
  BankingTedNotFoundException,
  BankingTedZroAccountNotExistsException,
  UserService,
  BankTedNotFoundException,
  BankingTedReceivedEventEmitter,
} from '@zro/banking/application';
import { OnboardingFactory, UserFactory } from '@zro/test/users/config';
import {
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import { BankingTedFactory, BankTedFactory } from '@zro/test/banking/config';
import { OnboardingNotFoundException } from '@zro/users/application';
import {
  WalletAccountNotFoundException,
  WalletNotActiveException,
  WalletNotFoundException,
} from '@zro/operations/application';

describe('HandlePendingBankingTedEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      bankingTedRepository,
      bankTedRepository,
      bankingTedReceivedRepository,
      bankingContactRepository,
      bankingAccountContactRepository,
      mockUpdateBankingTedRepository,
      mockGetBankingTedByIdRepository,
      mockGetBankTedByCodeRepository,
      mockCreateBankingTedReceived,
      mockGetBankingContactByUserAndDocumentRepository,
      mockCreateBankingContactRepository,
      mockCreateBankingAccountContactRepository,
    } = mockRepository();

    const {
      bankingTedEmitter,
      bankingTedReceivedEmitter,
      mockWaitingBankingTedEventEmitter,
      mockConfirmedBankingTedEventEmitter,
      mockReceivedBankingTedReceivedEventEmitter,
    } = mockEmitter();

    const {
      operationService,
      mockGetWalletAccountByAccountNumberAndCurrencyService,
      mockGetWalletAccountByWalletAndCurrencyService,
      mockCreateAndAcceptOperationService,
      userService,
      mockGetUserByUuidService,
      mockGetOnboardingByAccountNumberService,
      mockGetDefaultWalletByUserService,
    } = mockService();

    const { pspGateway, mockCreateGateway } = mockGateway();

    const bankingTedOperationCurrencyTag = 'REAL';
    const bankingTedOperationTedP2PTransactionTag = 'P2PBT';
    const bankingTedOperationTedTransactionTag = 'TED';
    const bankingTedOperationTedP2PDescription = 'Bank P2P Transfer';
    const bankingTedOperationTedDescription = 'Bank TED Transfer';
    const bankingTedZroBankCode = '82';
    const bankingTedCallbackUrl = 'localhost';

    const sut = new UseCase(
      logger,
      bankingTedRepository,
      bankTedRepository,
      bankingTedReceivedRepository,
      bankingContactRepository,
      bankingAccountContactRepository,
      pspGateway,
      bankingTedEmitter,
      bankingTedReceivedEmitter,
      operationService,
      userService,
      bankingTedOperationCurrencyTag,
      bankingTedOperationTedP2PTransactionTag,
      bankingTedOperationTedTransactionTag,
      bankingTedOperationTedP2PDescription,
      bankingTedOperationTedDescription,
      bankingTedZroBankCode,
      bankingTedCallbackUrl,
    );
    return {
      sut,
      mockUpdateBankingTedRepository,
      mockGetBankingTedByIdRepository,
      mockGetBankTedByCodeRepository,
      mockWaitingBankingTedEventEmitter,
      mockConfirmedBankingTedEventEmitter,
      mockReceivedBankingTedReceivedEventEmitter,
      mockGetWalletAccountByAccountNumberAndCurrencyService,
      mockGetWalletAccountByWalletAndCurrencyService,
      mockCreateAndAcceptOperationService,
      mockGetUserByUuidService,
      mockCreateGateway,
      mockCreateBankingTedReceived,
      mockGetOnboardingByAccountNumberService,
      mockGetDefaultWalletByUserService,
      mockGetBankingContactByUserAndDocumentRepository,
      mockCreateBankingContactRepository,
      mockCreateBankingAccountContactRepository,
    };
  };

  const mockRepository = () => {
    const bankingTedRepository: BankingTedRepository =
      createMock<BankingTedRepository>();
    const mockUpdateBankingTedRepository: jest.Mock = On(
      bankingTedRepository,
    ).get(method((mock) => mock.update));
    const mockGetBankingTedByIdRepository: jest.Mock = On(
      bankingTedRepository,
    ).get(method((mock) => mock.getById));

    const bankTedRepository: BankTedRepository =
      createMock<BankTedRepository>();
    const mockGetBankTedByCodeRepository: jest.Mock = On(bankTedRepository).get(
      method((mock) => mock.getByCode),
    );

    const bankingTedReceivedRepository: BankingTedReceivedRepository =
      createMock<BankingTedRepository>();
    const mockCreateBankingTedReceived: jest.Mock = On(
      bankingTedReceivedRepository,
    ).get(method((mock) => mock.create));

    const bankingContactRepository: BankingContactRepository =
      createMock<BankingContactRepository>();
    const mockCreateBankingContactRepository: jest.Mock = On(
      bankingContactRepository,
    ).get(method((mock) => mock.create));
    const mockGetBankingContactByUserAndDocumentRepository: jest.Mock = On(
      bankingContactRepository,
    ).get(method((mock) => mock.getByUserAndDocument));

    const bankingAccountContactRepository: BankingAccountContactRepository =
      createMock<BankingAccountContactRepository>();
    const mockCreateBankingAccountContactRepository: jest.Mock = On(
      bankingAccountContactRepository,
    ).get(method((mock) => mock.create));

    return {
      bankingTedRepository,
      bankTedRepository,
      bankingTedReceivedRepository,
      bankingContactRepository,
      bankingAccountContactRepository,
      mockUpdateBankingTedRepository,
      mockGetBankingTedByIdRepository,
      mockGetBankTedByCodeRepository,
      mockCreateBankingTedReceived,
      mockCreateBankingContactRepository,
      mockGetBankingContactByUserAndDocumentRepository,
      mockCreateBankingAccountContactRepository,
    };
  };

  const mockEmitter = () => {
    const bankingTedEmitter: BankingTedEventEmitter =
      createMock<BankingTedEventEmitter>();
    const mockWaitingBankingTedEventEmitter: jest.Mock = On(
      bankingTedEmitter,
    ).get(method((mock) => mock.waitingBankingTed));
    const mockConfirmedBankingTedEventEmitter: jest.Mock = On(
      bankingTedEmitter,
    ).get(method((mock) => mock.confirmedBankingTed));

    const bankingTedReceivedEmitter: BankingTedReceivedEventEmitter =
      createMock<BankingTedReceivedEventEmitter>();
    const mockReceivedBankingTedReceivedEventEmitter: jest.Mock = On(
      bankingTedReceivedEmitter,
    ).get(method((mock) => mock.receivedBankingTed));

    return {
      bankingTedEmitter,
      bankingTedReceivedEmitter,
      mockWaitingBankingTedEventEmitter,
      mockConfirmedBankingTedEventEmitter,
      mockReceivedBankingTedReceivedEventEmitter,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetWalletAccountByAccountNumberAndCurrencyService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getWalletAccountByAccountNumberAndCurrency));
    const mockGetWalletAccountByWalletAndCurrencyService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getWalletAccountByWalletAndCurrency));
    const mockCreateAndAcceptOperationService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.createAndAcceptOperation));
    const mockGetDefaultWalletByUserService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getWalletByUserAndDefaultIsTrue));

    const userService: UserService = createMock<UserService>();
    const mockGetUserByUuidService: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByUuid),
    );
    const mockGetOnboardingByAccountNumberService: jest.Mock = On(
      userService,
    ).get(
      method((mock) => mock.getOnboardingByAccountNumberAndStatusIsFinished),
    );

    return {
      operationService,
      mockGetWalletAccountByAccountNumberAndCurrencyService,
      mockGetWalletAccountByWalletAndCurrencyService,
      mockCreateAndAcceptOperationService,
      userService,
      mockGetUserByUuidService,
      mockGetOnboardingByAccountNumberService,
      mockGetDefaultWalletByUserService,
    };
  };

  const mockGateway = () => {
    const pspGateway: BankingTedGateway = createMock<BankingTedGateway>();
    const mockCreateGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.createBankingTed),
    );

    return {
      pspGateway,
      mockCreateGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle pending when id is null', async () => {
      const { sut } = makeSut();

      const ownerWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const tests = [
        () => sut.execute(null, ownerWallet),
        () => sut.execute(1, null),
        () => sut.execute(null, null),
        () => sut.execute(1, new WalletEntity({})),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }
    });

    it('TC0002 - Should not handle pending when bankingTed not found', async () => {
      const { sut, mockGetBankingTedByIdRepository } = makeSut();
      const { id } = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
      );

      const ownerWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetBankingTedByIdRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(id, ownerWallet);

      await expect(testScript).rejects.toThrow(BankingTedNotFoundException);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(id);
    });

    it('TC0003 - Should not handle pending when bankingTed is already paid (indepotent) with status confirmed', async () => {
      const { sut, mockGetBankingTedByIdRepository } = makeSut();

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.CONFIRMED },
      );
      const ownerWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);

      const result = await sut.execute(bankingTed.id, ownerWallet);

      expect(result).toBeDefined();
      expect(result.state).toBe(BankingTedState.CONFIRMED);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
    });

    it('TC0004 - Should not handle pending when status is not pending', async () => {
      const { sut, mockGetBankingTedByIdRepository } = makeSut();

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.FAILED },
      );
      const ownerWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);

      const testScript = () => sut.execute(bankingTed.id, ownerWallet);

      await expect(testScript).rejects.toThrow(BankingTedInvalidStateException);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
    });

    it('TC0005 - Should not handle pending when ownerUser is not found', async () => {
      const { sut, mockGetBankingTedByIdRepository, mockGetUserByUuidService } =
        makeSut();

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.PENDING, beneficiaryBankCode: '237' },
      );
      const ownerWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);
      mockGetUserByUuidService.mockResolvedValue(undefined);

      const testScript = () => sut.execute(bankingTed.id, ownerWallet);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should not handle pending when accountNumber is not found', async () => {
      const {
        sut,
        mockGetBankingTedByIdRepository,
        mockGetUserByUuidService,
        mockGetWalletAccountByWalletAndCurrencyService,
      } = makeSut();

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.PENDING, beneficiaryBankCode: '237' },
      );
      const ownerWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);
      mockGetUserByUuidService.mockResolvedValue(user);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValue(
        undefined,
      );

      const testScript = () => sut.execute(bankingTed.id, ownerWallet);

      await expect(testScript).rejects.toThrow(WalletAccountNotFoundException);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(
        mockGetWalletAccountByWalletAndCurrencyService,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0007 - Should not handle pending when is P2P and beneficiary account is not found', async () => {
      const {
        sut,
        mockGetBankingTedByIdRepository,
        mockGetUserByUuidService,
        mockGetWalletAccountByWalletAndCurrencyService,
        mockGetOnboardingByAccountNumberService,
        mockGetDefaultWalletByUserService,
      } = makeSut();

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        {
          state: BankingTedState.PENDING,
          beneficiaryBankCode: '82',
          beneficiaryAccount: 'XXXXXX',
        },
      );
      const ownerWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );
      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.ACTIVE },
      );

      mockGetUserByUuidService.mockResolvedValue(user);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValueOnce(
        walletAccount,
      );
      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValue(null);
      mockGetOnboardingByAccountNumberService.mockResolvedValue(onboarding);
      mockGetDefaultWalletByUserService.mockResolvedValue(wallet);

      const testScript = () => sut.execute(bankingTed.id, ownerWallet);

      await expect(testScript).rejects.toThrow(
        BankingTedZroAccountNotExistsException,
      );
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
      expect(
        mockGetWalletAccountByWalletAndCurrencyService,
      ).toHaveBeenCalledTimes(2);
      expect(mockGetOnboardingByAccountNumberService).toHaveBeenCalledTimes(1);
      expect(mockGetDefaultWalletByUserService).toHaveBeenCalledTimes(1);
    });

    it('TC0008 - Should not handle pending when is P2P and bank is not found', async () => {
      const {
        sut,
        mockGetBankingTedByIdRepository,
        mockGetBankTedByCodeRepository,
        mockGetUserByUuidService,
        mockGetWalletAccountByWalletAndCurrencyService,
        mockGetOnboardingByAccountNumberService,
        mockGetDefaultWalletByUserService,
      } = makeSut();

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.PENDING, beneficiaryBankCode: '82' },
      );
      const ownerWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );
      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.ACTIVE },
      );

      mockGetUserByUuidService.mockResolvedValue(user);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValueOnce(
        walletAccount,
      );
      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValueOnce(
        walletAccount,
      );
      mockGetBankTedByCodeRepository.mockResolvedValue(undefined);
      mockGetOnboardingByAccountNumberService.mockResolvedValue(onboarding);
      mockGetDefaultWalletByUserService.mockResolvedValue(wallet);

      const testScript = () => sut.execute(bankingTed.id, ownerWallet);

      await expect(testScript).rejects.toThrow(BankTedNotFoundException);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
      expect(
        mockGetWalletAccountByWalletAndCurrencyService,
      ).toHaveBeenCalledTimes(2);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByAccountNumberService).toHaveBeenCalledTimes(1);
      expect(mockGetDefaultWalletByUserService).toHaveBeenCalledTimes(1);
    });

    it('TC0009 - Should not handle pending when onboarding is not found', async () => {
      const {
        sut,
        mockGetBankingTedByIdRepository,
        mockGetBankTedByCodeRepository,
        mockGetUserByUuidService,
        mockGetWalletAccountByWalletAndCurrencyService,
        mockGetOnboardingByAccountNumberService,
      } = makeSut();

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.PENDING, beneficiaryBankCode: '82' },
      );
      const ownerWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      mockGetUserByUuidService.mockResolvedValue(user);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValueOnce(
        walletAccount,
      );
      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValue({});
      mockGetBankTedByCodeRepository.mockResolvedValue(undefined);
      mockGetOnboardingByAccountNumberService.mockResolvedValue(null);

      const testScript = () => sut.execute(bankingTed.id, ownerWallet);

      await expect(testScript).rejects.toThrow(OnboardingNotFoundException);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
      expect(
        mockGetWalletAccountByWalletAndCurrencyService,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByAccountNumberService).toHaveBeenCalledTimes(1);
    });

    it('TC0010 - Should not handle pending when beneficiary wallet is not found', async () => {
      const {
        sut,
        mockGetBankingTedByIdRepository,
        mockGetBankTedByCodeRepository,
        mockGetUserByUuidService,
        mockGetWalletAccountByWalletAndCurrencyService,
        mockGetOnboardingByAccountNumberService,
        mockGetDefaultWalletByUserService,
      } = makeSut();

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.PENDING, beneficiaryBankCode: '82' },
      );
      const ownerWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );
      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      mockGetUserByUuidService.mockResolvedValue(user);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValueOnce(
        walletAccount,
      );
      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValue({});
      mockGetBankTedByCodeRepository.mockResolvedValue(undefined);
      mockGetOnboardingByAccountNumberService.mockResolvedValue(onboarding);
      mockGetDefaultWalletByUserService.mockResolvedValue(null);

      const testScript = () => sut.execute(bankingTed.id, ownerWallet);

      await expect(testScript).rejects.toThrow(WalletNotFoundException);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
      expect(
        mockGetWalletAccountByWalletAndCurrencyService,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByAccountNumberService).toHaveBeenCalledTimes(1);
      expect(mockGetDefaultWalletByUserService).toHaveBeenCalledTimes(1);
    });

    it('TC0011 - Should not handle pending when beneficiary wallet is not active', async () => {
      const {
        sut,
        mockGetBankingTedByIdRepository,
        mockGetBankTedByCodeRepository,
        mockGetUserByUuidService,
        mockGetWalletAccountByWalletAndCurrencyService,
        mockGetOnboardingByAccountNumberService,
        mockGetDefaultWalletByUserService,
      } = makeSut();

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.PENDING, beneficiaryBankCode: '82' },
      );
      const ownerWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );
      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.DEACTIVATE },
      );

      mockGetUserByUuidService.mockResolvedValue(user);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValueOnce(
        walletAccount,
      );
      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValue({});
      mockGetBankTedByCodeRepository.mockResolvedValue(undefined);
      mockGetOnboardingByAccountNumberService.mockResolvedValue(onboarding);
      mockGetDefaultWalletByUserService.mockResolvedValue(wallet);

      const testScript = () => sut.execute(bankingTed.id, ownerWallet);

      await expect(testScript).rejects.toThrow(WalletNotActiveException);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
      expect(
        mockGetWalletAccountByWalletAndCurrencyService,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByAccountNumberService).toHaveBeenCalledTimes(1);
      expect(mockGetDefaultWalletByUserService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0012 - Should handle pending bankingTed and send to PSP', async () => {
      const {
        sut,
        mockGetBankingTedByIdRepository,
        mockGetBankingContactByUserAndDocumentRepository,
        mockCreateBankingContactRepository,
        mockCreateBankingAccountContactRepository,
        mockGetUserByUuidService,
        mockGetWalletAccountByWalletAndCurrencyService,
        mockCreateGateway,
        mockCreateAndAcceptOperationService,
        mockWaitingBankingTedEventEmitter,
      } = makeSut();

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.PENDING, beneficiaryBankCode: '237' },
      );
      const ownerWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);
      mockGetUserByUuidService.mockResolvedValue(user);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValue(
        walletAccount,
      );

      const result = await sut.execute(bankingTed.id, ownerWallet);

      expect(result).toBeDefined();
      expect(result.state).toBe(BankingTedState.WAITING);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetBankingContactByUserAndDocumentRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateBankingContactRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateBankingAccountContactRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreateBankingAccountContactRepository).toHaveBeenCalledWith(
        expect.objectContaining({
          bankName: bankingTed.beneficiaryBankName,
          bankCode: bankingTed.beneficiaryBankCode,
          accountType: bankingTed.beneficiaryAccountType,
          branchNumber: bankingTed.beneficiaryAgency,
          accountNumber: bankingTed.beneficiaryAccount,
          accountDigit: bankingTed.beneficiaryAccountDigit,
        }),
      );
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreateGateway).toHaveBeenCalledTimes(1);
      expect(mockWaitingBankingTedEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0013 - Should handle pending bankingTed and send to P2P', async () => {
      const {
        sut,
        mockGetBankingTedByIdRepository,
        mockGetBankTedByCodeRepository,
        mockGetBankingContactByUserAndDocumentRepository,
        mockCreateBankingContactRepository,
        mockCreateBankingAccountContactRepository,
        mockGetUserByUuidService,
        mockCreateAndAcceptOperationService,
        mockCreateGateway,
        mockConfirmedBankingTedEventEmitter,
        mockGetWalletAccountByWalletAndCurrencyService,
        mockGetOnboardingByAccountNumberService,
        mockGetDefaultWalletByUserService,
      } = makeSut();

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.PENDING, beneficiaryBankCode: '82' },
      );
      const ownerWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const bankTed = await BankTedFactory.create<BankTedEntity>(
        BankTedEntity.name,
      );
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );
      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.ACTIVE },
      );

      mockGetUserByUuidService.mockResolvedValue(user);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValueOnce(
        walletAccount,
      );
      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValueOnce(
        walletAccount,
      );
      mockGetBankTedByCodeRepository.mockResolvedValue(bankTed);
      mockGetOnboardingByAccountNumberService.mockResolvedValue(onboarding);
      mockGetDefaultWalletByUserService.mockResolvedValue(wallet);

      const result = await sut.execute(bankingTed.id, ownerWallet);

      expect(result).toBeDefined();
      expect(result.state).toBe(BankingTedState.CONFIRMED);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
      expect(
        mockGetBankingContactByUserAndDocumentRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateBankingContactRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateBankingAccountContactRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(
        mockGetWalletAccountByWalletAndCurrencyService,
      ).toHaveBeenCalledTimes(2);
      expect(mockGetBankTedByCodeRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(2);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
      expect(mockConfirmedBankingTedEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0014 - Should handle pending bankingTed and send to P2P and create banking contact if not exists', async () => {
      const {
        sut,
        mockGetBankingTedByIdRepository,
        mockGetBankTedByCodeRepository,
        mockGetBankingContactByUserAndDocumentRepository,
        mockCreateBankingContactRepository,
        mockCreateBankingAccountContactRepository,
        mockGetUserByUuidService,
        mockCreateAndAcceptOperationService,
        mockCreateGateway,
        mockConfirmedBankingTedEventEmitter,
        mockGetWalletAccountByWalletAndCurrencyService,
        mockGetOnboardingByAccountNumberService,
        mockGetDefaultWalletByUserService,
      } = makeSut();

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        { state: BankingTedState.PENDING, beneficiaryBankCode: '82' },
      );
      const ownerWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const bankTed = await BankTedFactory.create<BankTedEntity>(
        BankTedEntity.name,
      );
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );
      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.ACTIVE },
      );

      mockGetUserByUuidService.mockResolvedValue(user);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValueOnce(
        walletAccount,
      );
      mockGetBankingTedByIdRepository.mockResolvedValue(bankingTed);
      mockGetWalletAccountByWalletAndCurrencyService.mockResolvedValueOnce(
        walletAccount,
      );
      mockGetBankTedByCodeRepository.mockResolvedValue(bankTed);
      mockGetOnboardingByAccountNumberService.mockResolvedValue(onboarding);
      mockGetDefaultWalletByUserService.mockResolvedValue(wallet);
      mockGetBankingContactByUserAndDocumentRepository.mockResolvedValueOnce(
        null,
      );

      const result = await sut.execute(bankingTed.id, ownerWallet);

      expect(result).toBeDefined();
      expect(result.state).toBe(BankingTedState.CONFIRMED);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByIdRepository).toHaveBeenCalledWith(
        bankingTed.id,
      );
      expect(
        mockGetBankingContactByUserAndDocumentRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateBankingContactRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateBankingContactRepository).toHaveBeenCalledWith(
        expect.objectContaining({
          user: bankingTed.user,
          name: bankingTed.beneficiaryName,
          document: bankingTed.beneficiaryDocument,
        }),
      );
      expect(mockCreateBankingAccountContactRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(
        mockGetWalletAccountByWalletAndCurrencyService,
      ).toHaveBeenCalledTimes(2);
      expect(mockGetBankTedByCodeRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(2);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(1);
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
      expect(mockConfirmedBankingTedEventEmitter).toHaveBeenCalledTimes(1);
    });
  });
});
