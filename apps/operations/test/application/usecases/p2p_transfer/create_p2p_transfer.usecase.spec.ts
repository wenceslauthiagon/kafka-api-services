import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  ForbiddenException,
  defaultLogger as logger,
  MissingDataException,
} from '@zro/common';
import {
  CurrencyEntity,
  CurrencyRepository,
  CurrencyState,
  OperationEntity,
  P2PTransferEntity,
  P2PTransferRepository,
  WalletEntity,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  AcceptOperationUseCase,
  CreateOperationUseCase,
  CreateP2PTransferUseCase as UseCase,
  CurrencyNotActiveException,
  CurrencyNotFoundException,
} from '@zro/operations/application';
import {
  CurrencyFactory,
  OperationFactory,
  P2PTransferFactory,
  WalletFactory,
} from '@zro/test/operations/config';

describe('CreateP2PTransferUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const p2pTransferRepository: P2PTransferRepository =
      createMock<P2PTransferRepository>();
    const mockCreateP2PTransfer: jest.Mock = On(p2pTransferRepository).get(
      method((mock) => mock.create),
    );
    const mockGetP2PTransferById: jest.Mock = On(p2pTransferRepository).get(
      method((mock) => mock.getById),
    );

    const currencyRepository: CurrencyRepository =
      createMock<CurrencyRepository>();
    const mockGetCurrencyBySymbol: jest.Mock = On(currencyRepository).get(
      method((mock) => mock.getBySymbol),
    );

    const createOperationUseCase: CreateOperationUseCase =
      createMock<CreateOperationUseCase>();
    const mockCreateOperationUseCase: jest.Mock = On(
      createOperationUseCase,
    ).get(method((mock) => mock.execute));

    const acceptOperationUseCase: AcceptOperationUseCase =
      createMock<AcceptOperationUseCase>();
    const mockAcceptOperationUseCase: jest.Mock = On(
      acceptOperationUseCase,
    ).get(method((mock) => mock.execute));

    const WALLET_ID = faker.datatype.uuid();
    const P2P_TRANSACTION_TYPE = 'P2P';
    const DEBIT_TRANSACTION_TYPE = 'GWDEB';
    const CREDIT_TRANSACTION_TYPE = 'GWCRED';
    const sut = new UseCase(
      logger,
      p2pTransferRepository,
      currencyRepository,
      P2P_TRANSACTION_TYPE,
      createOperationUseCase,
      acceptOperationUseCase,
      CREDIT_TRANSACTION_TYPE,
      DEBIT_TRANSACTION_TYPE,
      WALLET_ID,
    );

    return {
      sut,
      WALLET_ID,
      P2P_TRANSACTION_TYPE,
      DEBIT_TRANSACTION_TYPE,
      CREDIT_TRANSACTION_TYPE,
      mockCreateP2PTransfer,
      mockGetP2PTransferById,
      mockGetCurrencyBySymbol,
      mockCreateOperationUseCase,
      mockAcceptOperationUseCase,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw a MissingDataException if missing data', async () => {
      const {
        sut,
        mockCreateP2PTransfer,
        mockGetP2PTransferById,
        mockGetCurrencyBySymbol,
        mockCreateOperationUseCase,
        mockAcceptOperationUseCase,
      } = makeSut();

      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const userWithoutUuid = new UserEntity({ uuid: null });

      const wallet = new WalletEntity({ uuid: faker.datatype.uuid() });
      const walletWithoutUuid = new WalletEntity({ uuid: null });

      const beneficiaryWallet = new WalletEntity({
        uuid: faker.datatype.uuid(),
      });
      const beneficiaryWalletWithoutUuid = new WalletEntity({ uuid: null });
      const amountCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const amountCurrencyWithoutSymbol =
        await CurrencyFactory.create<CurrencyEntity>(CurrencyEntity.name, {
          symbol: null,
        });

      const id = faker.datatype.uuid();
      const amount = faker.datatype.number({ min: 1, max: 999999 });

      const tests = [
        () =>
          sut.execute(
            null,
            user,
            wallet,
            beneficiaryWallet,
            amountCurrency,
            amount,
          ),
        () =>
          sut.execute(
            id,
            null,
            wallet,
            beneficiaryWallet,
            amountCurrency,
            amount,
          ),
        () =>
          sut.execute(
            id,
            userWithoutUuid,
            wallet,
            beneficiaryWallet,
            amountCurrency,
            amount,
          ),
        () =>
          sut.execute(
            id,
            user,
            null,
            beneficiaryWallet,
            amountCurrency,
            amount,
          ),
        () =>
          sut.execute(
            id,
            user,
            walletWithoutUuid,
            beneficiaryWallet,
            amountCurrency,
            amount,
          ),
        () => sut.execute(id, user, wallet, null, amountCurrency, amount),
        () =>
          sut.execute(
            id,
            user,
            wallet,
            beneficiaryWalletWithoutUuid,
            amountCurrency,
            amount,
          ),
        () => sut.execute(id, user, wallet, beneficiaryWallet, null, amount),
        () =>
          sut.execute(
            id,
            user,
            wallet,
            beneficiaryWallet,
            amountCurrencyWithoutSymbol,
            amount,
          ),
        () =>
          sut.execute(
            id,
            user,
            wallet,
            beneficiaryWallet,
            amountCurrency,
            null,
          ),
        () => sut.execute(null, null, null, null, null, null),
        () =>
          sut.execute(id, user, wallet, beneficiaryWallet, amountCurrency, NaN),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetP2PTransferById).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockCreateOperationUseCase).toHaveBeenCalledTimes(0);
      expect(mockAcceptOperationUseCase).toHaveBeenCalledTimes(0);
      expect(mockCreateP2PTransfer).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not return a P2PTransfer if user is not the owner', async () => {
      const {
        sut,
        mockCreateP2PTransfer,
        mockGetP2PTransferById,
        mockGetCurrencyBySymbol,
        mockCreateOperationUseCase,
        mockAcceptOperationUseCase,
      } = makeSut();

      const p2pTransfer = await P2PTransferFactory.create<P2PTransferEntity>(
        P2PTransferEntity.name,
      );

      mockGetP2PTransferById.mockResolvedValue(p2pTransfer);

      await expect(() =>
        sut.execute(
          p2pTransfer.id,
          p2pTransfer.user,
          p2pTransfer.beneficiaryWallet,
          p2pTransfer.wallet,
          p2pTransfer.currency,
          p2pTransfer.amount,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(mockGetP2PTransferById).toHaveBeenCalledTimes(1);
      expect(mockGetP2PTransferById).toHaveBeenCalledWith(p2pTransfer.id);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockCreateOperationUseCase).toHaveBeenCalledTimes(0);
      expect(mockAcceptOperationUseCase).toHaveBeenCalledTimes(0);
      expect(mockCreateP2PTransfer).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should return a P2PTransfer if already exists for id', async () => {
      const {
        sut,
        mockCreateP2PTransfer,
        mockGetP2PTransferById,
        mockGetCurrencyBySymbol,
        mockCreateOperationUseCase,
        mockAcceptOperationUseCase,
      } = makeSut();

      const p2pTransfer = await P2PTransferFactory.create<P2PTransferEntity>(
        P2PTransferEntity.name,
      );

      mockGetP2PTransferById.mockResolvedValue(p2pTransfer);

      const result = await sut.execute(
        p2pTransfer.id,
        p2pTransfer.user,
        p2pTransfer.wallet,
        p2pTransfer.beneficiaryWallet,
        p2pTransfer.currency,
        p2pTransfer.amount,
      );

      expect(result.id).toBe(p2pTransfer.id);
      expect(result.amount).toBe(p2pTransfer.amount);
      expect(mockGetP2PTransferById).toHaveBeenCalledTimes(1);
      expect(mockGetP2PTransferById).toHaveBeenCalledWith(p2pTransfer.id);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockCreateOperationUseCase).toHaveBeenCalledTimes(0);
      expect(mockAcceptOperationUseCase).toHaveBeenCalledTimes(0);
      expect(mockCreateP2PTransfer).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw if currency not exists', async () => {
      const {
        sut,
        mockCreateP2PTransfer,
        mockGetP2PTransferById,
        mockGetCurrencyBySymbol,
        mockCreateOperationUseCase,
        mockAcceptOperationUseCase,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const beneficiaryWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const amountCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const id = faker.datatype.uuid();
      const amount = faker.datatype.number({ min: 1, max: 999999 });

      mockGetP2PTransferById.mockResolvedValue(null);
      mockGetCurrencyBySymbol.mockResolvedValue(null);

      const result = () =>
        sut.execute(
          id,
          wallet.user,
          wallet,
          beneficiaryWallet,
          amountCurrency,
          amount,
        );

      await expect(result).rejects.toThrow(CurrencyNotFoundException);
      expect(mockGetP2PTransferById).toHaveBeenCalledTimes(1);
      expect(mockGetP2PTransferById).toHaveBeenCalledWith(id);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledWith(
        amountCurrency.symbol,
      );
      expect(mockCreateOperationUseCase).toHaveBeenCalledTimes(0);
      expect(mockAcceptOperationUseCase).toHaveBeenCalledTimes(0);
      expect(mockCreateP2PTransfer).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw if currency is not active', async () => {
      const {
        sut,
        mockCreateP2PTransfer,
        mockGetP2PTransferById,
        mockGetCurrencyBySymbol,
        mockCreateOperationUseCase,
        mockAcceptOperationUseCase,
      } = makeSut();

      const id = faker.datatype.uuid();
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const beneficiaryWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const amountCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { state: CurrencyState.DEACTIVATE },
      );
      const amount = faker.datatype.number({ min: 1, max: 999999 });

      mockGetP2PTransferById.mockResolvedValue(null);
      mockGetCurrencyBySymbol.mockResolvedValue(amountCurrency);

      const result = () =>
        sut.execute(
          id,
          wallet.user,
          wallet,
          beneficiaryWallet,
          amountCurrency,
          amount,
        );

      await expect(result).rejects.toThrow(CurrencyNotActiveException);
      expect(mockGetP2PTransferById).toHaveBeenCalledTimes(1);
      expect(mockGetP2PTransferById).toHaveBeenCalledWith(id);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledWith(
        amountCurrency.symbol,
      );
      expect(mockCreateOperationUseCase).toHaveBeenCalledTimes(0);
      expect(mockAcceptOperationUseCase).toHaveBeenCalledTimes(0);
      expect(mockCreateP2PTransfer).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should create P2PTransfer successfully', async () => {
      const {
        sut,
        P2P_TRANSACTION_TYPE,
        mockCreateP2PTransfer,
        mockGetP2PTransferById,
        mockGetCurrencyBySymbol,
        mockCreateOperationUseCase,
        mockAcceptOperationUseCase,
      } = makeSut();

      const id = faker.datatype.uuid();
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const beneficiaryWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const amountCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const amount = faker.datatype.number({ min: 1, max: 999999 });
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      mockGetP2PTransferById.mockResolvedValue(null);
      mockGetCurrencyBySymbol.mockResolvedValue(amountCurrency);
      mockCreateOperationUseCase.mockResolvedValue({
        ownerOperation: operation,
      });
      mockAcceptOperationUseCase.mockResolvedValue(operation);
      mockCreateP2PTransfer.mockImplementationOnce((i) => i);

      const result = await sut.execute(
        id,
        wallet.user,
        wallet,
        beneficiaryWallet,
        amountCurrency,
        amount,
      );

      expect(result.id).toBe(id);
      expect(result.amount).toBe(amount);
      expect(mockGetP2PTransferById).toHaveBeenCalledTimes(1);
      expect(mockGetP2PTransferById).toHaveBeenCalledWith(id);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledWith(
        amountCurrency.symbol,
      );
      expect(mockCreateOperationUseCase).toHaveBeenCalledTimes(1);
      expect(mockCreateOperationUseCase).toBeCalledWith(
        P2P_TRANSACTION_TYPE,
        expect.any(Object),
        expect.any(Object),
      );
      expect(mockAcceptOperationUseCase).toHaveBeenCalledTimes(1);
      expect(mockCreateP2PTransfer).toHaveBeenCalledTimes(1);
    });

    it('TC0007 - Should create P2PTransfer with same owner and beneficiary wallet', async () => {
      const {
        sut,
        P2P_TRANSACTION_TYPE,
        mockCreateP2PTransfer,
        mockGetP2PTransferById,
        mockGetCurrencyBySymbol,
        mockCreateOperationUseCase,
        mockAcceptOperationUseCase,
      } = makeSut();

      const id = faker.datatype.uuid();
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const amountCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const amount = faker.datatype.number({ min: 1, max: 999999 });
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      mockGetP2PTransferById.mockResolvedValue(null);
      mockGetCurrencyBySymbol.mockResolvedValue(amountCurrency);
      mockCreateOperationUseCase.mockResolvedValue({
        ownerOperation: operation,
      });
      mockAcceptOperationUseCase.mockResolvedValue(operation);
      mockCreateP2PTransfer.mockImplementationOnce((i) => i);

      const result = await sut.execute(
        id,
        wallet.user,
        wallet,
        wallet,
        amountCurrency,
        amount,
      );

      expect(result.id).toBe(id);
      expect(result.amount).toBe(amount);
      expect(mockGetP2PTransferById).toHaveBeenCalledTimes(1);
      expect(mockGetP2PTransferById).toHaveBeenCalledWith(id);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledWith(
        amountCurrency.symbol,
      );
      expect(mockCreateOperationUseCase).toHaveBeenCalledTimes(1);
      expect(mockCreateOperationUseCase).toBeCalledWith(
        P2P_TRANSACTION_TYPE,
        expect.any(Object),
        expect.any(Object),
      );
      expect(mockAcceptOperationUseCase).toHaveBeenCalledTimes(1);
      expect(mockCreateP2PTransfer).toHaveBeenCalledTimes(1);
    });

    it('TC0008 - Should create gateway credit P2PTransfer', async () => {
      const {
        sut,
        WALLET_ID,
        CREDIT_TRANSACTION_TYPE,
        mockCreateP2PTransfer,
        mockGetP2PTransferById,
        mockGetCurrencyBySymbol,
        mockCreateOperationUseCase,
        mockAcceptOperationUseCase,
      } = makeSut();

      const id = faker.datatype.uuid();
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { uuid: WALLET_ID },
      );
      const beneficiaryWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const amountCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const amount = faker.datatype.number({ min: 1, max: 999999 });
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      mockGetP2PTransferById.mockResolvedValue(null);
      mockGetCurrencyBySymbol.mockResolvedValue(amountCurrency);
      mockCreateOperationUseCase.mockResolvedValue({
        ownerOperation: operation,
      });
      mockAcceptOperationUseCase.mockResolvedValue(operation);
      mockCreateP2PTransfer.mockImplementationOnce((i) => i);

      const result = await sut.execute(
        id,
        wallet.user,
        wallet,
        beneficiaryWallet,
        amountCurrency,
        amount,
      );

      expect(result.id).toBe(id);
      expect(result.amount).toBe(amount);
      expect(mockGetP2PTransferById).toHaveBeenCalledTimes(1);
      expect(mockGetP2PTransferById).toHaveBeenCalledWith(id);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledWith(
        amountCurrency.symbol,
      );
      expect(mockCreateOperationUseCase).toHaveBeenCalledTimes(1);
      expect(mockCreateOperationUseCase).toBeCalledWith(
        CREDIT_TRANSACTION_TYPE,
        null,
        expect.any(Object),
      );
      expect(mockAcceptOperationUseCase).toHaveBeenCalledTimes(1);
      expect(mockCreateP2PTransfer).toHaveBeenCalledTimes(1);
    });

    it('TC0009 - Should create gateway debit P2PTransfer', async () => {
      const {
        sut,
        WALLET_ID,
        DEBIT_TRANSACTION_TYPE,
        mockCreateP2PTransfer,
        mockGetP2PTransferById,
        mockGetCurrencyBySymbol,
        mockCreateOperationUseCase,
        mockAcceptOperationUseCase,
      } = makeSut();

      const id = faker.datatype.uuid();
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const beneficiaryWallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { uuid: WALLET_ID },
      );
      const amountCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const amount = faker.datatype.number({ min: 1, max: 999999 });
      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      mockGetP2PTransferById.mockResolvedValue(null);
      mockGetCurrencyBySymbol.mockResolvedValue(amountCurrency);
      mockCreateOperationUseCase.mockResolvedValue({
        ownerOperation: operation,
      });
      mockAcceptOperationUseCase.mockResolvedValue(operation);
      mockCreateP2PTransfer.mockImplementationOnce((i) => i);

      const result = await sut.execute(
        id,
        wallet.user,
        wallet,
        beneficiaryWallet,
        amountCurrency,
        amount,
      );

      expect(result.id).toBe(id);
      expect(result.amount).toBe(amount);
      expect(mockGetP2PTransferById).toHaveBeenCalledTimes(1);
      expect(mockGetP2PTransferById).toHaveBeenCalledWith(id);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledWith(
        amountCurrency.symbol,
      );
      expect(mockCreateOperationUseCase).toHaveBeenCalledTimes(1);
      expect(mockCreateOperationUseCase).toBeCalledWith(
        DEBIT_TRANSACTION_TYPE,
        expect.any(Object),
        null,
      );
      expect(mockAcceptOperationUseCase).toHaveBeenCalledTimes(1);
      expect(mockCreateP2PTransfer).toHaveBeenCalledTimes(1);
    });
  });
});
