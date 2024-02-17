import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  WalletAccountRepository,
  OperationEntity,
  TransactionTypeEntity,
  OperationRepository,
  CurrencyRepository,
  WalletAccountEntity,
  CurrencyEntity,
  CurrencyType,
} from '@zro/operations/domain';
import {
  OtcService,
  HandleCalculateCryptoAvgPriceEventUseCase as UseCase,
  WalletAccountNotFoundException,
  CurrencyInvalidTypeException,
  CurrencyNotFoundException,
} from '@zro/operations/application';
import {
  CurrencyFactory,
  OperationFactory,
  TransactionTypeFactory,
  WalletAccountFactory,
} from '@zro/test/operations/config';

const APP_OPERATION_CRYPTO_TRANSACTION_TAGS_FILTER = 'CONV;CASHBACK';
const CONVERSION_TAG = 'CONV';
const TED_RECEIVED_TAG = 'TEDRECEIVE';

describe('HandleCalculateCryptoAvgPriceEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const walletAccountRepository = createMock<WalletAccountRepository>();
    const mockGetWalletAccountById: jest.Mock = On(walletAccountRepository).get(
      method((mock) => mock.getById),
    );
    const mockUpdateWalletAccount: jest.Mock = On(walletAccountRepository).get(
      method((mock) => mock.update),
    );

    const operationRepository = createMock<OperationRepository>();
    const mockGetOperationById: jest.Mock = On(operationRepository).get(
      method((mock) => mock.getById),
    );

    const currencyRepository = createMock<CurrencyRepository>();
    const mockGetCurrencyById = On(currencyRepository).get(
      method((mock) => mock.getById),
    );

    return {
      walletAccountRepository,
      mockGetWalletAccountById,
      mockUpdateWalletAccount,
      operationRepository,
      mockGetOperationById,
      currencyRepository,
      mockGetCurrencyById,
    };
  };

  const mockService = () => {
    const otcService = createMock<OtcService>();
    const mockGetConversionByOperation: jest.Mock = On(otcService).get(
      method((mock) => mock.getConversionByOperation),
    );

    return {
      otcService,
      mockGetConversionByOperation,
    };
  };

  const makeSut = () => {
    const {
      walletAccountRepository,
      mockGetWalletAccountById,
      mockUpdateWalletAccount,
      operationRepository,
      mockGetOperationById,
      currencyRepository,
      mockGetCurrencyById,
    } = mockRepository();

    const { otcService, mockGetConversionByOperation } = mockService();

    const sut = new UseCase(
      logger,
      walletAccountRepository,
      operationRepository,
      currencyRepository,
      otcService,
      APP_OPERATION_CRYPTO_TRANSACTION_TAGS_FILTER,
    );
    return {
      sut,
      mockGetWalletAccountById,
      mockUpdateWalletAccount,
      mockGetOperationById,
      mockGetCurrencyById,
      mockGetConversionByOperation,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not calculate crypto avg price if missing params', async () => {
      const {
        sut,
        mockGetWalletAccountById,
        mockGetConversionByOperation,
        mockUpdateWalletAccount,
        mockGetOperationById,
      } = makeSut();

      const tests = [
        () => sut.execute(null),
        () => sut.execute(new OperationEntity({})),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetOperationById).toHaveBeenCalledTimes(0);

      expect(mockGetWalletAccountById).toHaveBeenCalledTimes(0);
      expect(mockGetConversionByOperation).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletAccount).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not calculate crypto avg if transaction type tag not valid', async () => {
      const {
        sut,
        mockGetWalletAccountById,
        mockGetConversionByOperation,
        mockUpdateWalletAccount,
        mockGetOperationById,
      } = makeSut();

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          {
            tag: TED_RECEIVED_TAG,
          },
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          transactionType,
        },
      );

      mockGetOperationById.mockResolvedValueOnce(operation);

      await sut.execute(operation);

      expect(mockGetWalletAccountById).toHaveBeenCalledTimes(0);
      expect(mockGetConversionByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletAccount).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not calculate crypto avg if wallet account not found', async () => {
      const {
        sut,
        mockGetWalletAccountById,
        mockGetConversionByOperation,
        mockUpdateWalletAccount,
        mockGetOperationById,
      } = makeSut();

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          {
            tag: CONVERSION_TAG,
          },
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          transactionType,
        },
      );

      mockGetOperationById.mockResolvedValueOnce(operation);

      mockGetWalletAccountById.mockResolvedValueOnce(null);

      await expect(sut.execute(operation)).rejects.toThrow(
        WalletAccountNotFoundException,
      );

      expect(mockGetWalletAccountById).toHaveBeenCalledTimes(1);
      expect(mockGetConversionByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletAccount).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not calculate crypto avg if currency not found', async () => {
      const {
        sut,
        mockGetWalletAccountById,
        mockGetConversionByOperation,
        mockUpdateWalletAccount,
        mockGetOperationById,
        mockGetCurrencyById,
      } = makeSut();

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          {
            tag: CONVERSION_TAG,
          },
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          transactionType,
        },
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
        );

      mockGetOperationById.mockResolvedValueOnce(operation);
      mockGetWalletAccountById.mockResolvedValueOnce(walletAccount);
      mockGetCurrencyById.mockResolvedValueOnce(null);

      await expect(sut.execute(operation)).rejects.toThrow(
        CurrencyNotFoundException,
      );

      expect(mockGetWalletAccountById).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(1);
      expect(mockGetConversionByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletAccount).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not calculate crypto avg if currency type not valid', async () => {
      const {
        sut,
        mockGetWalletAccountById,
        mockGetConversionByOperation,
        mockUpdateWalletAccount,
        mockGetOperationById,
        mockGetCurrencyById,
      } = makeSut();

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          {
            tag: CONVERSION_TAG,
          },
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          transactionType,
        },
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
        );

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        {
          type: CurrencyType.FAN_TOKEN,
        },
      );

      mockGetOperationById.mockResolvedValueOnce(operation);

      mockGetWalletAccountById.mockResolvedValueOnce(walletAccount);
      mockGetCurrencyById.mockResolvedValueOnce(currency);

      await expect(sut.execute(operation)).rejects.toThrow(
        CurrencyInvalidTypeException,
      );

      expect(mockGetWalletAccountById).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(1);
      expect(mockGetConversionByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletAccount).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should calculate crypto avg succsuccessfully', async () => {
      const {
        sut,
        mockGetWalletAccountById,
        mockGetOperationById,
        mockGetCurrencyById,
        mockUpdateWalletAccount,
      } = makeSut();

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          {
            tag: CONVERSION_TAG,
          },
        );

      const operationRef = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          transactionType,
          operationRef,
        },
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
        );

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        {
          type: CurrencyType.CRYPTO,
        },
      );

      mockGetWalletAccountById.mockResolvedValueOnce(walletAccount);
      mockGetOperationById.mockResolvedValueOnce(operationRef);
      mockGetCurrencyById.mockResolvedValueOnce(currency);

      await sut.execute(operation);

      expect(mockGetWalletAccountById).toHaveBeenCalledTimes(1);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyById).toHaveBeenCalledTimes(1);
      expect(mockUpdateWalletAccount).toHaveBeenCalledTimes(1);
    });
  });
});
