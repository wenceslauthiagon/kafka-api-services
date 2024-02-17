import { cnpj } from 'cpf-cnpj-validator';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import {
  PixDepositEntity,
  PixDepositCacheRepository,
  WarningPixSkipListEntity,
  WarningPixSkipListRepository,
} from '@zro/pix-payments/domain';
import { WalletAccountEntity, CurrencyEntity } from '@zro/operations/domain';
import {
  ReceivePixDepositUseCase as UseCase,
  OperationService,
  PixDepositEventEmitter,
  BankingService,
  PixDepositReceivedAccountNotFoundException,
  BankNotFoundException,
  PixDepositReceivedBankNotAllowedException,
} from '@zro/pix-payments/application';
import {
  PixDepositFactory,
  WarningPixSkipListFactory,
} from '@zro/test/pix-payments/config';
import { BankFactory } from '@zro/test/banking/config';
import {
  CurrencyFactory,
  WalletAccountFactory,
} from '@zro/test/operations/config';

describe('ReceivePixDepositUseCase', () => {
  const makeSut = () => {
    const pixDepositCacheRepository: PixDepositCacheRepository =
      createMock<PixDepositCacheRepository>();
    const warningPixSkipListCacheRepository: WarningPixSkipListRepository =
      createMock<WarningPixSkipListRepository>();

    const pixDepositEventEmitter: PixDepositEventEmitter =
      createMock<PixDepositEventEmitter>();

    const operationService: OperationService = createMock<OperationService>();
    const bankingService: BankingService = createMock<BankingService>();
    const warningPixSkipListRepository: WarningPixSkipListRepository =
      createMock<WarningPixSkipListRepository>();

    const operationCurrencyTag = 'REAL';
    const operationReceivedPixDepositTransactionTag = 'PIXREC';
    const zroBankIspb = 'ZROBANK';

    const mockGetByIdDepositRepository: jest.Mock = On(
      pixDepositCacheRepository,
    ).get(method((mock) => mock.getById));

    const mockGetBankByIspb: jest.Mock = On(bankingService).get(
      method((mock) => mock.getBankByIspb),
    );

    const mockGetWalletAccountByAccountNumberAndCurrency: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getWalletAccountByAccountNumberAndCurrency));

    const mockCreateDepositRepository: jest.Mock = On(
      pixDepositCacheRepository,
    ).get(method((mock) => mock.create));

    const mockGetByClientAccountNumberCache: jest.Mock = On(
      warningPixSkipListCacheRepository,
    ).get(method((mock) => mock.getByClientAccountNumber));

    const mockGetByClientAccountNumber: jest.Mock = On(
      warningPixSkipListRepository,
    ).get(method((mock) => mock.getByClientAccountNumber));

    const mockWaitingDepositEvent: jest.Mock = On(pixDepositEventEmitter).get(
      method((mock) => mock.waitingDeposit),
    );

    const mockNewDepositEvent: jest.Mock = On(pixDepositEventEmitter).get(
      method((mock) => mock.newDeposit),
    );

    const mockCreateSkipListCacheRepository: jest.Mock = On(
      warningPixSkipListCacheRepository,
    ).get(method((mock) => mock.create));

    const sut = new UseCase(
      logger,
      pixDepositCacheRepository,
      warningPixSkipListCacheRepository,
      pixDepositEventEmitter,
      operationService,
      bankingService,
      warningPixSkipListRepository,
      operationCurrencyTag,
      operationReceivedPixDepositTransactionTag,
      zroBankIspb,
    );

    return {
      sut,
      mockGetByIdDepositRepository,
      mockGetBankByIspb,
      mockGetWalletAccountByAccountNumberAndCurrency,
      mockCreateDepositRepository,
      mockGetByClientAccountNumberCache,
      mockGetByClientAccountNumber,
      mockWaitingDepositEvent,
      mockNewDepositEvent,
      mockCreateSkipListCacheRepository,
    };
  };

  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params', async () => {
      const { sut } = makeSut();

      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      const testScripts = [
        () =>
          sut.execute(
            null,
            data.amount,
            data.txId,
            data.endToEndId,
            data.clientBank,
            data.clientBranch,
            data.clientAccountNumber,
            data.clientDocument,
            data.clientName,
            data.clientKey,
            data.thirdPartBank,
            data.thirdPartBranch,
            data.thirdPartAccountType,
            data.thirdPartAccountNumber,
            data.thirdPartDocument,
            data.thirdPartName,
            data.thirdPartKey,
            data.description,
          ),
        () =>
          sut.execute(
            data.id,
            data.amount,
            data.txId,
            data.endToEndId,
            null,
            data.clientBranch,
            data.clientAccountNumber,
            data.clientDocument,
            data.clientName,
            data.clientKey,
            data.thirdPartBank,
            data.thirdPartBranch,
            data.thirdPartAccountType,
            data.thirdPartAccountNumber,
            data.thirdPartDocument,
            data.thirdPartName,
            data.thirdPartKey,
            data.description,
          ),
        () =>
          sut.execute(
            data.id,
            data.amount,
            data.txId,
            data.endToEndId,
            data.clientBank,
            null,
            data.clientAccountNumber,
            data.clientDocument,
            data.clientName,
            data.clientKey,
            data.thirdPartBank,
            data.thirdPartBranch,
            data.thirdPartAccountType,
            data.thirdPartAccountNumber,
            data.thirdPartDocument,
            data.thirdPartName,
            data.thirdPartKey,
            data.description,
          ),
        () =>
          sut.execute(
            data.id,
            data.amount,
            data.txId,
            data.endToEndId,
            data.clientBank,
            data.clientBranch,
            null,
            data.clientDocument,
            data.clientName,
            data.clientKey,
            data.thirdPartBank,
            data.thirdPartBranch,
            data.thirdPartAccountType,
            data.thirdPartAccountNumber,
            data.thirdPartDocument,
            data.thirdPartName,
            data.thirdPartKey,
            data.description,
          ),
        () =>
          sut.execute(
            data.id,
            data.amount,
            data.txId,
            data.endToEndId,
            data.clientBank,
            data.clientBranch,
            data.clientAccountNumber,
            null,
            data.clientName,
            data.clientKey,
            data.thirdPartBank,
            data.thirdPartBranch,
            data.thirdPartAccountType,
            data.thirdPartAccountNumber,
            data.thirdPartDocument,
            data.thirdPartName,
            data.thirdPartKey,
            data.description,
          ),
        () =>
          sut.execute(
            data.id,
            data.amount,
            data.txId,
            data.endToEndId,
            data.clientBank,
            data.clientBranch,
            data.clientAccountNumber,
            data.clientDocument,
            data.clientName,
            data.clientKey,
            null,
            data.thirdPartBranch,
            data.thirdPartAccountType,
            data.thirdPartAccountNumber,
            data.thirdPartDocument,
            data.thirdPartName,
            data.thirdPartKey,
            data.description,
          ),
        () =>
          sut.execute(
            data.id,
            data.amount,
            data.txId,
            data.endToEndId,
            data.clientBank,
            data.clientBranch,
            data.clientAccountNumber,
            data.clientDocument,
            data.clientName,
            data.clientKey,
            data.thirdPartBank,
            data.thirdPartBranch,
            data.thirdPartAccountType,
            null,
            data.thirdPartDocument,
            data.thirdPartName,
            data.thirdPartKey,
            data.description,
          ),
        () =>
          sut.execute(
            data.id,
            null,
            data.txId,
            data.endToEndId,
            data.clientBank,
            data.clientBranch,
            data.clientAccountNumber,
            data.clientDocument,
            data.clientName,
            data.clientKey,
            data.thirdPartBank,
            data.thirdPartBranch,
            data.thirdPartAccountType,
            data.thirdPartAccountNumber,
            data.thirdPartDocument,
            data.thirdPartName,
            data.thirdPartKey,
            data.description,
          ),
      ];

      for (const testScript of testScripts) {
        await expect(testScript).rejects.toThrow(MissingDataException);
      }
    });

    it('TC0002 - Should return deposit if it already exists', async () => {
      const { sut, mockGetByIdDepositRepository } = makeSut();

      const checkDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      mockGetByIdDepositRepository.mockResolvedValueOnce(checkDeposit);

      const testScript = await sut.execute(
        checkDeposit.id,
        checkDeposit.amount,
        checkDeposit.txId,
        checkDeposit.endToEndId,
        checkDeposit.clientBank,
        checkDeposit.clientBranch,
        checkDeposit.clientAccountNumber,
        checkDeposit.clientDocument,
        checkDeposit.clientName,
        checkDeposit.clientKey,
        checkDeposit.thirdPartBank,
        checkDeposit.thirdPartBranch,
        checkDeposit.thirdPartAccountType,
        checkDeposit.thirdPartAccountNumber,
        checkDeposit.thirdPartDocument,
        checkDeposit.thirdPartName,
        checkDeposit.thirdPartKey,
        checkDeposit.description,
      );

      expect(testScript).toBeDefined();
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should throw PixDepositReceivedBankNotAllowedException if client bank is not from zro.', async () => {
      const { sut, mockGetByIdDepositRepository } = makeSut();

      const checkDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          clientBank: new BankEntity({
            ispb: 'INVALID BANK',
          }),
        },
      );

      mockGetByIdDepositRepository.mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(
          checkDeposit.id,
          checkDeposit.amount,
          checkDeposit.txId,
          checkDeposit.endToEndId,
          checkDeposit.clientBank,
          checkDeposit.clientBranch,
          checkDeposit.clientAccountNumber,
          checkDeposit.clientDocument,
          checkDeposit.clientName,
          checkDeposit.clientKey,
          checkDeposit.thirdPartBank,
          checkDeposit.thirdPartBranch,
          checkDeposit.thirdPartAccountType,
          checkDeposit.thirdPartAccountNumber,
          checkDeposit.thirdPartDocument,
          checkDeposit.thirdPartName,
          checkDeposit.thirdPartKey,
          checkDeposit.description,
        );

      await expect(testScript).rejects.toThrow(
        PixDepositReceivedBankNotAllowedException,
      );
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should throw BankNotFoundException when the client bank is not found.', async () => {
      const { sut, mockGetByIdDepositRepository, mockGetBankByIspb } =
        makeSut();

      const checkDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          clientBank: new BankEntity({
            ispb: 'ZROBANK',
          }),
        },
      );

      mockGetByIdDepositRepository.mockResolvedValueOnce(null);
      mockGetBankByIspb.mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(
          checkDeposit.id,
          checkDeposit.amount,
          checkDeposit.txId,
          checkDeposit.endToEndId,
          checkDeposit.clientBank,
          checkDeposit.clientBranch,
          checkDeposit.clientAccountNumber,
          checkDeposit.clientDocument,
          checkDeposit.clientName,
          checkDeposit.clientKey,
          checkDeposit.thirdPartBank,
          checkDeposit.thirdPartBranch,
          checkDeposit.thirdPartAccountType,
          checkDeposit.thirdPartAccountNumber,
          checkDeposit.thirdPartDocument,
          checkDeposit.thirdPartName,
          checkDeposit.thirdPartKey,
          checkDeposit.description,
        );

      await expect(testScript).rejects.toThrow(BankNotFoundException);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankByIspb).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should throw BankNotFoundException when the third part bank is not found.', async () => {
      const { sut, mockGetByIdDepositRepository, mockGetBankByIspb } =
        makeSut();

      const clientBank = await BankFactory.create<BankEntity>(BankEntity.name, {
        ispb: 'ZROBANK',
      });

      const checkDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          clientBank,
        },
      );

      mockGetByIdDepositRepository.mockResolvedValueOnce(null);
      mockGetBankByIspb.mockResolvedValueOnce(clientBank);
      mockGetBankByIspb.mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(
          checkDeposit.id,
          checkDeposit.amount,
          checkDeposit.txId,
          checkDeposit.endToEndId,
          checkDeposit.clientBank,
          checkDeposit.clientBranch,
          checkDeposit.clientAccountNumber,
          checkDeposit.clientDocument,
          checkDeposit.clientName,
          checkDeposit.clientKey,
          checkDeposit.thirdPartBank,
          checkDeposit.thirdPartBranch,
          checkDeposit.thirdPartAccountType,
          checkDeposit.thirdPartAccountNumber,
          checkDeposit.thirdPartDocument,
          checkDeposit.thirdPartName,
          checkDeposit.thirdPartKey,
          checkDeposit.description,
        );

      await expect(testScript).rejects.toThrow(BankNotFoundException);
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankByIspb).toHaveBeenCalledTimes(2);
    });

    it('TC0006 - Should throw PixDepositReceivedAccountNotFoundException when the wallet account is not found.', async () => {
      const {
        sut,
        mockGetByIdDepositRepository,
        mockGetBankByIspb,
        mockGetWalletAccountByAccountNumberAndCurrency,
      } = makeSut();

      const clientBank = await BankFactory.create<BankEntity>(BankEntity.name, {
        ispb: 'ZROBANK',
      });

      const thirdPartBank = await BankFactory.create<BankEntity>(
        BankEntity.name,
      );

      const checkDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          clientBank,
          thirdPartBank,
        },
      );

      mockGetByIdDepositRepository.mockResolvedValueOnce(null);
      mockGetBankByIspb.mockResolvedValueOnce(clientBank);
      mockGetBankByIspb.mockResolvedValueOnce(thirdPartBank);
      mockGetWalletAccountByAccountNumberAndCurrency.mockResolvedValueOnce(
        null,
      );

      const testScript = () =>
        sut.execute(
          checkDeposit.id,
          checkDeposit.amount,
          checkDeposit.txId,
          checkDeposit.endToEndId,
          checkDeposit.clientBank,
          checkDeposit.clientBranch,
          checkDeposit.clientAccountNumber,
          checkDeposit.clientDocument,
          checkDeposit.clientName,
          checkDeposit.clientKey,
          checkDeposit.thirdPartBank,
          checkDeposit.thirdPartBranch,
          checkDeposit.thirdPartAccountType,
          checkDeposit.thirdPartAccountNumber,
          checkDeposit.thirdPartDocument,
          checkDeposit.thirdPartName,
          checkDeposit.thirdPartKey,
          checkDeposit.description,
        );

      await expect(testScript).rejects.toThrow(
        PixDepositReceivedAccountNotFoundException,
      );
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankByIspb).toHaveBeenCalledTimes(2);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrency,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0007 - Should receive pix deposit successfully and skip checks by emiting waiting event.', async () => {
      const {
        sut,
        mockGetByIdDepositRepository,
        mockGetBankByIspb,
        mockGetWalletAccountByAccountNumberAndCurrency,
        mockCreateDepositRepository,
        mockGetByClientAccountNumberCache,
        mockNewDepositEvent,
        mockWaitingDepositEvent,
      } = makeSut();

      const clientBank = await BankFactory.create<BankEntity>(BankEntity.name, {
        ispb: 'ZROBANK',
      });

      const thirdPartBank = await BankFactory.create<BankEntity>(
        BankEntity.name,
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          {
            currency: await CurrencyFactory.create<CurrencyEntity>(
              CurrencyEntity.name,
              {
                tag: 'REAL',
              },
            ),
          },
        );

      const checkDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          clientBank,
          thirdPartBank,
          clientAccountNumber: walletAccount.accountNumber,
        },
      );

      const skipAccount =
        await WarningPixSkipListFactory.create<WarningPixSkipListEntity>(
          WarningPixSkipListEntity.name,
        );

      mockGetByIdDepositRepository.mockResolvedValueOnce(null);
      mockGetBankByIspb.mockResolvedValueOnce(clientBank);
      mockGetBankByIspb.mockResolvedValueOnce(thirdPartBank);
      mockGetWalletAccountByAccountNumberAndCurrency.mockResolvedValueOnce(
        walletAccount,
      );
      mockGetByClientAccountNumberCache.mockResolvedValueOnce(skipAccount);

      const testScript = await sut.execute(
        checkDeposit.id,
        checkDeposit.amount,
        checkDeposit.txId,
        checkDeposit.endToEndId,
        checkDeposit.clientBank,
        checkDeposit.clientBranch,
        checkDeposit.clientAccountNumber,
        checkDeposit.clientDocument,
        checkDeposit.clientName,
        checkDeposit.clientKey,
        checkDeposit.thirdPartBank,
        checkDeposit.thirdPartBranch,
        checkDeposit.thirdPartAccountType,
        checkDeposit.thirdPartAccountNumber,
        checkDeposit.thirdPartDocument,
        checkDeposit.thirdPartName,
        checkDeposit.thirdPartKey,
        checkDeposit.description,
      );

      expect(testScript).toBeDefined();
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankByIspb).toHaveBeenCalledTimes(2);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrency,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateDepositRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrency,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetByClientAccountNumberCache).toHaveBeenCalledTimes(1);
      expect(mockNewDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockWaitingDepositEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0008 - Should receive pix deposit successfully and skip checks by emiting waiting event.', async () => {
      const {
        sut,
        mockGetByIdDepositRepository,
        mockGetBankByIspb,
        mockGetWalletAccountByAccountNumberAndCurrency,
        mockCreateDepositRepository,
        mockGetByClientAccountNumberCache,
        mockGetByClientAccountNumber,
        mockNewDepositEvent,
        mockWaitingDepositEvent,
      } = makeSut();

      const clientBank = await BankFactory.create<BankEntity>(BankEntity.name, {
        ispb: 'ZROBANK',
      });

      const thirdPartBank = await BankFactory.create<BankEntity>(
        BankEntity.name,
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          {
            currency: await CurrencyFactory.create<CurrencyEntity>(
              CurrencyEntity.name,
              {
                tag: 'REAL',
              },
            ),
          },
        );

      const checkDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          clientBank,
          thirdPartBank,
          clientAccountNumber: walletAccount.accountNumber,
        },
      );

      const skipAccount =
        await WarningPixSkipListFactory.create<WarningPixSkipListEntity>(
          WarningPixSkipListEntity.name,
        );

      mockGetByIdDepositRepository.mockResolvedValueOnce(null);
      mockGetBankByIspb.mockResolvedValueOnce(clientBank);
      mockGetBankByIspb.mockResolvedValueOnce(thirdPartBank);
      mockGetWalletAccountByAccountNumberAndCurrency.mockResolvedValueOnce(
        walletAccount,
      );
      mockGetByClientAccountNumberCache.mockResolvedValueOnce(null);
      mockGetByClientAccountNumber.mockResolvedValueOnce(skipAccount);

      const testScript = await sut.execute(
        checkDeposit.id,
        checkDeposit.amount,
        checkDeposit.txId,
        checkDeposit.endToEndId,
        checkDeposit.clientBank,
        checkDeposit.clientBranch,
        checkDeposit.clientAccountNumber,
        checkDeposit.clientDocument,
        checkDeposit.clientName,
        checkDeposit.clientKey,
        checkDeposit.thirdPartBank,
        checkDeposit.thirdPartBranch,
        checkDeposit.thirdPartAccountType,
        checkDeposit.thirdPartAccountNumber,
        checkDeposit.thirdPartDocument,
        checkDeposit.thirdPartName,
        checkDeposit.thirdPartKey,
        checkDeposit.description,
      );

      expect(testScript).toBeDefined();
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankByIspb).toHaveBeenCalledTimes(2);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrency,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateDepositRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrency,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetByClientAccountNumberCache).toHaveBeenCalledTimes(1);
      expect(mockNewDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockWaitingDepositEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0009 - Should receive pix deposit successfully and start checks by emiting new event.', async () => {
      const {
        sut,
        mockGetByIdDepositRepository,
        mockGetBankByIspb,
        mockGetWalletAccountByAccountNumberAndCurrency,
        mockCreateDepositRepository,
        mockGetByClientAccountNumberCache,
        mockGetByClientAccountNumber,
        mockNewDepositEvent,
        mockWaitingDepositEvent,
      } = makeSut();

      const clientBank = await BankFactory.create<BankEntity>(BankEntity.name, {
        ispb: 'ZROBANK',
      });

      const thirdPartBank = await BankFactory.create<BankEntity>(
        BankEntity.name,
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          {
            currency: await CurrencyFactory.create<CurrencyEntity>(
              CurrencyEntity.name,
              {
                tag: 'REAL',
              },
            ),
          },
        );

      const checkDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          clientBank,
          thirdPartBank,
          clientAccountNumber: walletAccount.accountNumber,
        },
      );

      mockGetByIdDepositRepository.mockResolvedValueOnce(null);
      mockGetBankByIspb.mockResolvedValueOnce(clientBank);
      mockGetBankByIspb.mockResolvedValueOnce(thirdPartBank);
      mockGetWalletAccountByAccountNumberAndCurrency.mockResolvedValueOnce(
        walletAccount,
      );
      mockGetByClientAccountNumberCache.mockResolvedValueOnce(null);
      mockGetByClientAccountNumber.mockResolvedValueOnce(null);

      const testScript = await sut.execute(
        checkDeposit.id,
        checkDeposit.amount,
        checkDeposit.txId,
        checkDeposit.endToEndId,
        checkDeposit.clientBank,
        checkDeposit.clientBranch,
        checkDeposit.clientAccountNumber,
        checkDeposit.clientDocument,
        checkDeposit.clientName,
        checkDeposit.clientKey,
        checkDeposit.thirdPartBank,
        checkDeposit.thirdPartBranch,
        checkDeposit.thirdPartAccountType,
        checkDeposit.thirdPartAccountNumber,
        checkDeposit.thirdPartDocument,
        checkDeposit.thirdPartName,
        checkDeposit.thirdPartKey,
        checkDeposit.description,
      );

      expect(testScript).toBeDefined();
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankByIspb).toHaveBeenCalledTimes(2);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrency,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateDepositRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrency,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetByClientAccountNumberCache).toHaveBeenCalledTimes(1);
      expect(mockGetByClientAccountNumber).toHaveBeenCalledTimes(1);
      expect(mockNewDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockWaitingDepositEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0010 - Should receive pix deposit successfully, create skip account into cache, and skip checks by emiting waiting event.', async () => {
      const {
        sut,
        mockGetByIdDepositRepository,
        mockGetBankByIspb,
        mockGetWalletAccountByAccountNumberAndCurrency,
        mockCreateDepositRepository,
        mockGetByClientAccountNumberCache,
        mockGetByClientAccountNumber,
        mockNewDepositEvent,
        mockWaitingDepositEvent,
        mockCreateSkipListCacheRepository,
      } = makeSut();

      const clientBank = await BankFactory.create<BankEntity>(BankEntity.name, {
        ispb: 'ZROBANK',
      });

      const thirdPartBank = await BankFactory.create<BankEntity>(
        BankEntity.name,
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          {
            currency: await CurrencyFactory.create<CurrencyEntity>(
              CurrencyEntity.name,
              {
                tag: 'REAL',
              },
            ),
          },
        );

      const checkDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          clientBank,
          thirdPartBank,
          clientAccountNumber: walletAccount.accountNumber,
          clientDocument: cnpj.generate(),
          thirdPartDocument: cnpj.generate(),
        },
      );

      const skipAccount =
        await WarningPixSkipListFactory.create<WarningPixSkipListEntity>(
          WarningPixSkipListEntity.name,
        );

      mockGetByIdDepositRepository.mockResolvedValueOnce(null);
      mockGetBankByIspb.mockResolvedValueOnce(clientBank);
      mockGetBankByIspb.mockResolvedValueOnce(thirdPartBank);
      mockGetWalletAccountByAccountNumberAndCurrency.mockResolvedValueOnce(
        walletAccount,
      );
      mockGetByClientAccountNumberCache.mockResolvedValueOnce(null);
      mockGetByClientAccountNumber.mockResolvedValueOnce(skipAccount);

      const testScript = await sut.execute(
        checkDeposit.id,
        checkDeposit.amount,
        checkDeposit.txId,
        checkDeposit.endToEndId,
        checkDeposit.clientBank,
        checkDeposit.clientBranch,
        checkDeposit.clientAccountNumber,
        checkDeposit.clientDocument,
        checkDeposit.clientName,
        checkDeposit.clientKey,
        checkDeposit.thirdPartBank,
        checkDeposit.thirdPartBranch,
        checkDeposit.thirdPartAccountType,
        checkDeposit.thirdPartAccountNumber,
        checkDeposit.thirdPartDocument,
        checkDeposit.thirdPartName,
        checkDeposit.thirdPartKey,
        checkDeposit.description,
      );

      expect(testScript).toBeDefined();
      expect(mockGetByIdDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetBankByIspb).toHaveBeenCalledTimes(2);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrency,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateDepositRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetWalletAccountByAccountNumberAndCurrency,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetByClientAccountNumberCache).toHaveBeenCalledTimes(1);
      expect(mockGetByClientAccountNumber).toHaveBeenCalledTimes(1);
      expect(mockNewDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockWaitingDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockCreateSkipListCacheRepository).toHaveBeenCalledTimes(1);
    });
  });
});
