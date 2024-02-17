import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { ForbiddenException } from '@nestjs/common';
import {
  MissingDataException,
  defaultLogger as logger,
  ReceiptPortugueseTranslation,
} from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  OperationEntity,
  OperationRepository,
  ReceiptEntity,
  TransactionTypeEntity,
  WalletAccountEntity,
  WalletAccountCacheRepository,
  WalletEntity,
  UserWalletRepository,
  UserWalletEntity,
  WalletRepository,
} from '@zro/operations/domain';
import {
  BankingService,
  GetOperationReceiptByUserAndWalletAndIdUseCase as UseCase,
  OperationNotFoundException,
  OtcService,
  PixPaymentsService,
  UserService,
  WalletAccountsNotFoundException,
} from '@zro/operations/application';
import {
  OperationFactory,
  TransactionTypeFactory,
  UserWalletFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('GetOperationReceiptByUserAndWalletAndId', () => {
  const mockRepository = () => {
    const operationRepository: OperationRepository =
      createMock<OperationRepository>();
    const mockGetByWalletAccountsAndId: jest.Mock = On(operationRepository).get(
      method((mock) => mock.getByWalletAccountsAndId),
    );

    const walletAccountCacheRepository: WalletAccountCacheRepository =
      createMock<WalletAccountCacheRepository>();
    const mockWalletAccountGetAllByWallet: jest.Mock = On(
      walletAccountCacheRepository,
    ).get(method((mock) => mock.getAllByWallet));
    const mockGetWalletAccountById: jest.Mock = On(
      walletAccountCacheRepository,
    ).get(method((mock) => mock.getById));

    const userUserWalletRepository: UserWalletRepository =
      createMock<UserWalletRepository>();
    const mockGetUserWalletByUserAndWallet: jest.Mock = On(
      userUserWalletRepository,
    ).get(method((mock) => mock.getByUserAndWallet));

    const walletRepository: WalletRepository = createMock<WalletRepository>();
    const mockWalletGetByUuid: jest.Mock = On(walletRepository).get(
      method((mock) => mock.getByUuid),
    );

    return {
      operationRepository,
      walletAccountCacheRepository,
      userUserWalletRepository,
      walletRepository,
      mockGetByWalletAccountsAndId,
      mockGetUserWalletByUserAndWallet,
      mockWalletAccountGetAllByWallet,
      mockWalletGetByUuid,
      mockGetWalletAccountById,
    };
  };

  const mockService = () => {
    const userService: UserService = createMock<UserService>();
    const mockGetUserByIdService: jest.Mock = On(userService).get(
      method((mock) => mock.getUserById),
    );

    const pixPaymentsService: PixPaymentsService =
      createMock<PixPaymentsService>();
    const mockGetPaymentReceiptService: jest.Mock = On(pixPaymentsService).get(
      method((mock) => mock.getPaymentReceipt),
    );

    const bankingService: BankingService = createMock<BankingService>();
    const mockGetBankingTedReceiptService: jest.Mock = On(bankingService).get(
      method((mock) => mock.getBankingTedReceipt),
    );

    const otcService: OtcService = createMock<OtcService>();
    const mockGetOtcReceiptService: jest.Mock = On(otcService).get(
      method((mock) => mock.getOtcReceipt),
    );

    return {
      userService,
      mockGetUserByIdService,
      pixPaymentsService,
      mockGetPaymentReceiptService,
      bankingService,
      mockGetBankingTedReceiptService,
      otcService,
      mockGetOtcReceiptService,
    };
  };

  const makeSut = () => {
    const {
      operationRepository,
      walletAccountCacheRepository,
      userUserWalletRepository,
      walletRepository,
      mockGetUserWalletByUserAndWallet,
      mockWalletAccountGetAllByWallet,
      mockGetByWalletAccountsAndId,
      mockGetWalletAccountById,
      mockWalletGetByUuid,
    } = mockRepository();

    const {
      userService,
      mockGetUserByIdService,
      pixPaymentsService,
      mockGetPaymentReceiptService,
      bankingService,
      mockGetBankingTedReceiptService,
      otcService,
      mockGetOtcReceiptService,
    } = mockService();

    const sut = new UseCase(
      logger,
      operationRepository,
      walletAccountCacheRepository,
      userUserWalletRepository,
      walletRepository,
      pixPaymentsService,
      userService,
      bankingService,
      otcService,
    );

    return {
      sut,
      operationRepository,
      mockWalletAccountGetAllByWallet,
      mockGetByWalletAccountsAndId,
      mockGetPaymentReceiptService,
      mockGetBankingTedReceiptService,
      mockGetOtcReceiptService,
      mockGetUserWalletByUserAndWallet,
      mockGetUserByIdService,
      mockGetWalletAccountById,
      mockWalletGetByUuid,
    };
  };

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get with missing params', async () => {
      const {
        sut,
        mockGetByWalletAccountsAndId,
        mockWalletAccountGetAllByWallet,
        mockGetPaymentReceiptService,
        mockGetBankingTedReceiptService,
        mockGetOtcReceiptService,
        mockGetUserWalletByUserAndWallet,
      } = makeSut();

      const tests = [
        () => sut.execute(null, null, null),
        () => sut.execute(new UserEntity({}), null, null),
        () => sut.execute(null, new WalletEntity({}), null),
        () => sut.execute(null, null, faker.datatype.uuid()),
        () =>
          sut.execute(
            new UserEntity({}),
            new WalletEntity({}),
            faker.datatype.uuid(),
          ),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledTimes(0);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingTedReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetOtcReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not get if user wallet not found', async () => {
      const {
        sut,
        mockGetByWalletAccountsAndId,
        mockWalletAccountGetAllByWallet,
        mockGetPaymentReceiptService,
        mockGetBankingTedReceiptService,
        mockGetOtcReceiptService,
        mockGetUserWalletByUserAndWallet,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const id = faker.datatype.uuid();

      mockGetUserWalletByUserAndWallet.mockResolvedValue(null);

      const result = () => sut.execute(user, wallet, id);

      await expect(result).rejects.toThrow(ForbiddenException);

      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledTimes(0);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingTedReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetOtcReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledWith(
        user,
        wallet,
      );
    });

    it('TC0003 - Should not get if wallet accounts not found', async () => {
      const {
        sut,
        mockGetByWalletAccountsAndId,
        mockWalletAccountGetAllByWallet,
        mockGetPaymentReceiptService,
        mockGetBankingTedReceiptService,
        mockGetOtcReceiptService,
        mockGetUserWalletByUserAndWallet,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const { wallet, user } = userWallet;

      const id = faker.datatype.uuid();

      mockWalletAccountGetAllByWallet.mockResolvedValue([]);
      mockGetUserWalletByUserAndWallet.mockResolvedValue(userWallet);

      const result = () => sut.execute(user, wallet, id);

      await expect(result).rejects.toThrow(WalletAccountsNotFoundException);

      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledTimes(1);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledWith(wallet);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingTedReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetOtcReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledWith(
        user,
        wallet,
      );
    });

    it('TC0004 - Should not get if operation not found', async () => {
      const {
        sut,
        mockGetByWalletAccountsAndId,
        mockWalletAccountGetAllByWallet,
        mockGetPaymentReceiptService,
        mockGetBankingTedReceiptService,
        mockGetOtcReceiptService,
        mockGetUserWalletByUserAndWallet,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const { wallet, user } = userWallet;

      const walletAccounts =
        await WalletAccountFactory.createMany<WalletAccountEntity>(
          WalletAccountEntity.name,
          3,
        );

      const id = faker.datatype.uuid();

      mockGetUserWalletByUserAndWallet.mockResolvedValue(userWallet);
      mockWalletAccountGetAllByWallet.mockResolvedValue(walletAccounts);
      mockGetByWalletAccountsAndId.mockResolvedValue(null);

      const result = () => sut.execute(user, wallet, id);

      await expect(result).rejects.toThrow(OperationNotFoundException);

      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledTimes(1);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledWith(wallet);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingTedReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetOtcReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledWith(
        user,
        wallet,
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should get pix payment receipt successfully', async () => {
      const {
        sut,
        mockGetByWalletAccountsAndId,
        mockWalletAccountGetAllByWallet,
        mockGetPaymentReceiptService,
        mockGetBankingTedReceiptService,
        mockGetOtcReceiptService,
        mockGetUserWalletByUserAndWallet,
        mockGetWalletAccountById,
        mockWalletGetByUuid,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const { wallet, user } = userWallet;

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          { tag: sut.PIX_PAYMENTS_TAGS[0] },
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { transactionType },
      );

      const { id } = operation;

      const walletAccounts =
        await WalletAccountFactory.createMany<WalletAccountEntity>(
          WalletAccountEntity.name,
          3,
        );

      mockWalletAccountGetAllByWallet.mockResolvedValue(walletAccounts);
      mockGetByWalletAccountsAndId.mockResolvedValue(operation);
      mockGetPaymentReceiptService.mockResolvedValue(
        new ReceiptEntity({
          paymentTitle: ReceiptPortugueseTranslation.pixSent,
        }),
      );
      mockGetUserWalletByUserAndWallet.mockResolvedValue(userWallet);

      const result = await sut.execute(user, wallet, id);

      expect(result).toBeDefined();
      expect(result.paymentTitle).toBe(ReceiptPortugueseTranslation.pixSent);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledTimes(1);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledWith(wallet);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(1);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledWith(
        walletAccounts,
        id,
      );
      expect(mockGetPaymentReceiptService).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentReceiptService).toHaveBeenCalledWith(
        user,
        wallet,
        operation,
      );
      expect(mockGetBankingTedReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetOtcReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledWith(
        user,
        wallet,
      );
      expect(mockGetWalletAccountById).toHaveBeenCalledTimes(0);
      expect(mockWalletGetByUuid).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should get banking receipt successfully', async () => {
      const {
        sut,
        mockGetByWalletAccountsAndId,
        mockWalletAccountGetAllByWallet,
        mockGetPaymentReceiptService,
        mockGetBankingTedReceiptService,
        mockGetOtcReceiptService,
        mockGetUserWalletByUserAndWallet,
        mockGetWalletAccountById,
        mockWalletGetByUuid,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const { wallet, user } = userWallet;

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          { tag: sut.BANKING_TAGS[0] },
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { transactionType },
      );

      const { id } = operation;

      const walletAccounts =
        await WalletAccountFactory.createMany<WalletAccountEntity>(
          WalletAccountEntity.name,
          3,
        );

      mockWalletAccountGetAllByWallet.mockResolvedValue(walletAccounts);
      mockGetByWalletAccountsAndId.mockResolvedValue(operation);
      mockGetBankingTedReceiptService.mockResolvedValue(
        new ReceiptEntity({
          paymentTitle: ReceiptPortugueseTranslation.ted,
        }),
      );
      mockGetUserWalletByUserAndWallet.mockResolvedValue(userWallet);

      const result = await sut.execute(user, wallet, id);

      expect(result).toBeDefined();
      expect(result.paymentTitle).toBe(ReceiptPortugueseTranslation.ted);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledTimes(1);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledWith(wallet);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(1);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledWith(
        walletAccounts,
        id,
      );
      expect(mockGetPaymentReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingTedReceiptService).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedReceiptService).toHaveBeenCalledWith(
        user,
        operation,
      );
      expect(mockGetOtcReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledWith(
        user,
        wallet,
      );
      expect(mockGetWalletAccountById).toHaveBeenCalledTimes(0);
      expect(mockWalletGetByUuid).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should get otc receipt successfully', async () => {
      const {
        sut,
        mockGetByWalletAccountsAndId,
        mockWalletAccountGetAllByWallet,
        mockGetPaymentReceiptService,
        mockGetBankingTedReceiptService,
        mockGetOtcReceiptService,
        mockGetUserWalletByUserAndWallet,
        mockGetWalletAccountById,
        mockWalletGetByUuid,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const { wallet, user } = userWallet;

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          { tag: sut.OTC_TAGS[0] },
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { transactionType },
      );

      const { id } = operation;

      const walletAccounts =
        await WalletAccountFactory.createMany<WalletAccountEntity>(
          WalletAccountEntity.name,
          3,
        );

      mockWalletAccountGetAllByWallet.mockResolvedValue(walletAccounts);
      mockGetByWalletAccountsAndId.mockResolvedValue(operation);
      mockGetOtcReceiptService.mockResolvedValue(
        new ReceiptEntity({
          paymentTitle: ReceiptPortugueseTranslation.cov,
        }),
      );
      mockGetUserWalletByUserAndWallet.mockResolvedValue(userWallet);

      const result = await sut.execute(user, wallet, id);

      expect(result).toBeDefined();
      expect(result.paymentTitle).toBe(ReceiptPortugueseTranslation.cov);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledTimes(1);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledWith(wallet);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(1);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledWith(
        walletAccounts,
        id,
      );
      expect(mockGetPaymentReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingTedReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetOtcReceiptService).toHaveBeenCalledTimes(1);
      expect(mockGetOtcReceiptService).toHaveBeenCalledWith(
        user,
        operation,
        operation.currency,
      );
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledWith(
        user,
        wallet,
      );
      expect(mockGetWalletAccountById).toHaveBeenCalledTimes(0);
      expect(mockWalletGetByUuid).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should get p2pbt receipt successfully', async () => {
      const {
        sut,
        mockGetByWalletAccountsAndId,
        mockWalletAccountGetAllByWallet,
        mockGetPaymentReceiptService,
        mockGetBankingTedReceiptService,
        mockGetOtcReceiptService,
        mockGetUserWalletByUserAndWallet,
        mockGetWalletAccountById,
        mockWalletGetByUuid,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const { wallet, user } = userWallet;

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          { tag: sut.OPERATIONS_TAGS[0] },
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { transactionType },
      );

      const { id } = operation;

      const walletAccounts =
        await WalletAccountFactory.createMany<WalletAccountEntity>(
          WalletAccountEntity.name,
          3,
        );

      mockWalletAccountGetAllByWallet.mockResolvedValue(walletAccounts);
      mockGetByWalletAccountsAndId.mockResolvedValue(operation);
      mockGetUserWalletByUserAndWallet.mockResolvedValue(userWallet);
      mockWalletGetByUuid.mockResolvedValueOnce(
        operation.ownerWalletAccount.wallet,
      );
      mockWalletGetByUuid.mockResolvedValueOnce(
        operation.beneficiaryWalletAccount.wallet,
      );
      mockGetWalletAccountById.mockResolvedValue(
        operation.beneficiaryWalletAccount,
      );

      const result = await sut.execute(user, wallet, id);

      expect(result).toBeDefined();
      expect(result.paymentTitle).toBe(ReceiptPortugueseTranslation.p2pbt);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledTimes(1);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledWith(wallet);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(1);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledWith(
        walletAccounts,
        id,
      );
      expect(mockGetPaymentReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingTedReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetOtcReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledWith(
        user,
        wallet,
      );
      expect(mockWalletGetByUuid).toHaveBeenCalledTimes(2);
      expect(mockGetWalletAccountById).toHaveBeenCalledTimes(1);
      expect(mockGetWalletAccountById).toHaveBeenCalledWith(
        operation.beneficiaryWalletAccount.id,
      );
    });

    it('TC0009 - Should get withdraw receipt successfully', async () => {
      const {
        sut,
        mockGetByWalletAccountsAndId,
        mockWalletAccountGetAllByWallet,
        mockGetPaymentReceiptService,
        mockGetBankingTedReceiptService,
        mockGetOtcReceiptService,
        mockGetUserWalletByUserAndWallet,
        mockGetUserByIdService,
        mockGetWalletAccountById,
        mockWalletGetByUuid,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const { wallet, user } = userWallet;

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          { tag: sut.OPERATIONS_TAGS[1] },
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { transactionType },
      );

      const { id } = operation;

      const walletAccounts =
        await WalletAccountFactory.createMany<WalletAccountEntity>(
          WalletAccountEntity.name,
          3,
        );

      mockWalletAccountGetAllByWallet.mockResolvedValue(walletAccounts);
      mockGetByWalletAccountsAndId.mockResolvedValue(operation);
      mockGetUserWalletByUserAndWallet.mockResolvedValue(userWallet);
      mockGetUserByIdService.mockResolvedValueOnce(operation.owner);
      mockGetUserByIdService.mockResolvedValue(operation.beneficiary);

      const result = await sut.execute(user, wallet, id);

      expect(result).toBeDefined();
      expect(result.paymentTitle).toBe(ReceiptPortugueseTranslation.withdraw);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledTimes(1);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledWith(wallet);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(1);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledWith(
        walletAccounts,
        id,
      );
      expect(mockGetPaymentReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingTedReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetOtcReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledWith(
        user,
        wallet,
      );
      expect(mockGetWalletAccountById).toHaveBeenCalledTimes(0);
      expect(mockWalletGetByUuid).toHaveBeenCalledTimes(0);
    });

    it('TC0010 - Should get cwdeb receipt successfully', async () => {
      const {
        sut,
        mockGetByWalletAccountsAndId,
        mockWalletAccountGetAllByWallet,
        mockGetPaymentReceiptService,
        mockGetBankingTedReceiptService,
        mockGetOtcReceiptService,
        mockGetUserWalletByUserAndWallet,
        mockGetUserByIdService,
        mockGetWalletAccountById,
        mockWalletGetByUuid,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const { wallet, user } = userWallet;

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          { tag: sut.OPERATIONS_TAGS[2] },
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { transactionType },
      );

      const { id } = operation;

      const walletAccounts =
        await WalletAccountFactory.createMany<WalletAccountEntity>(
          WalletAccountEntity.name,
          3,
        );

      mockWalletAccountGetAllByWallet.mockResolvedValue(walletAccounts);
      mockGetByWalletAccountsAndId.mockResolvedValue(operation);
      mockGetUserWalletByUserAndWallet.mockResolvedValue(userWallet);
      mockGetUserByIdService.mockResolvedValueOnce(operation.owner);
      mockGetUserByIdService.mockResolvedValue(operation.beneficiary);

      const result = await sut.execute(user, wallet, id);

      expect(result).toBeDefined();
      expect(result.paymentTitle).toBe(ReceiptPortugueseTranslation.p2pbt);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledTimes(1);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledWith(wallet);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(1);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledWith(
        walletAccounts,
        id,
      );
      expect(mockGetPaymentReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingTedReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetOtcReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledWith(
        user,
        wallet,
      );
      expect(mockGetWalletAccountById).toHaveBeenCalledTimes(0);
      expect(mockWalletGetByUuid).toHaveBeenCalledTimes(0);
    });

    it('TC0011 - Should get cwcred receipt successfully', async () => {
      const {
        sut,
        mockGetByWalletAccountsAndId,
        mockWalletAccountGetAllByWallet,
        mockGetPaymentReceiptService,
        mockGetBankingTedReceiptService,
        mockGetOtcReceiptService,
        mockGetUserWalletByUserAndWallet,
        mockGetUserByIdService,
        mockGetWalletAccountById,
        mockWalletGetByUuid,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const { wallet, user } = userWallet;

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          { tag: sut.OPERATIONS_TAGS[3] },
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { transactionType },
      );

      const { id } = operation;

      const walletAccounts =
        await WalletAccountFactory.createMany<WalletAccountEntity>(
          WalletAccountEntity.name,
          3,
        );

      mockWalletAccountGetAllByWallet.mockResolvedValue(walletAccounts);
      mockGetByWalletAccountsAndId.mockResolvedValue(operation);
      mockGetUserWalletByUserAndWallet.mockResolvedValue(userWallet);
      mockGetUserByIdService.mockResolvedValueOnce(operation.owner);
      mockGetUserByIdService.mockResolvedValue(operation.beneficiary);

      const result = await sut.execute(user, wallet, id);

      expect(result).toBeDefined();
      expect(result.paymentTitle).toBe(ReceiptPortugueseTranslation.p2pbt);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledTimes(1);
      expect(mockWalletAccountGetAllByWallet).toHaveBeenCalledWith(wallet);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledTimes(1);
      expect(mockGetByWalletAccountsAndId).toHaveBeenCalledWith(
        walletAccounts,
        id,
      );
      expect(mockGetPaymentReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetBankingTedReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetOtcReceiptService).toHaveBeenCalledTimes(0);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserAndWallet).toHaveBeenCalledWith(
        user,
        wallet,
      );
      expect(mockGetWalletAccountById).toHaveBeenCalledTimes(0);
      expect(mockWalletGetByUuid).toHaveBeenCalledTimes(0);
    });
  });
});
