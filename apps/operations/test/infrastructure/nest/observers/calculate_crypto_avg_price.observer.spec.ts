import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { ConversionEntity } from '@zro/otc/domain';
import { OperationState } from '@zro/operations/domain';
import { OtcService } from '@zro/operations/application';
import { HandleCalculateCryptoAvgPriceEventRequest } from '@zro/operations/interface';
import {
  CalculateCryptoAvgPriceNestObserver as Observer,
  OperationModel,
  WalletAccountDatabaseRepository,
  OperationDatabaseRepository,
  CurrencyDatabaseRepository,
  TransactionTypeModel,
  CurrencyModel,
  WalletAccountModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { OperationFactory } from '@zro/test/operations/config';
import { ConversionFactory } from '@zro/test/otc/config';

const BTC_CURRENCY_TAG = 'BTC';
const CONVERSION_TRANSACTION_TAG = 'CONV';
const CASHBACK_TRANSACTION_TAG = 'CASHBACK';
const P2PBT_TRANSACTION_TAG = 'P2PBT';

describe('CalculateCryptoAvgPriceNestObserver', () => {
  let module: TestingModule;
  let observer: Observer;
  let walletAccountRepository: WalletAccountDatabaseRepository;
  let operationRepository: OperationDatabaseRepository;
  let currencyRepository: CurrencyDatabaseRepository;

  const otcService: OtcService = createMock<OtcService>();
  const mockGetConversionByOperation: jest.Mock = On(otcService).get(
    method((mock) => mock.getConversionByOperation),
  );

  const mockGetCryptoPriceByCurrencyAndDate: jest.Mock = On(otcService).get(
    method((mock) => mock.getCryptoPriceByCurrencyAndDate),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    observer = module.get<Observer>(Observer);
    walletAccountRepository = new WalletAccountDatabaseRepository();
    operationRepository = new OperationDatabaseRepository();
    currencyRepository = new CurrencyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update avg price in wallet account successfully if missing params', async () => {
      const transactionType = await TransactionTypeModel.findOne({
        where: { tag: CONVERSION_TRANSACTION_TAG },
      });

      const currencyBtc = await CurrencyModel.findOne({
        where: { tag: BTC_CURRENCY_TAG },
      });

      const operationRef = await OperationFactory.create<OperationModel>(
        OperationModel.name,
        {
          transactionTypeId: transactionType.id,
          value: 5000,
        },
      );

      const operation = await OperationFactory.create<OperationModel>(
        OperationModel.name,
        {
          transactionTypeId: transactionType.id,
          operationRefId: operationRef.id,
          currencyId: currencyBtc.id,
          value: 9581619,
        },
      );

      await WalletAccountModel.update(
        {
          averagePrice: 0,
        },
        { where: { id: operation.beneficiaryWalletAccountId } },
      );

      const message: HandleCalculateCryptoAvgPriceEventRequest = {
        ownerOperation: {
          id: operation.id,
          state: OperationState.ACCEPTED,
          rawValue: operation.rawValue,
          value: operation.value,
          fee: operation.fee,
          ownerRequestedRawValue: operation.ownerRequestedRawValue,
          ownerRequestedFee: operation.ownerRequestedFee,
          description: operation.description,
          ownerId: operation.ownerId,
          beneficiaryId: operation.beneficiaryId,
          ownerWalletAccountId: operation.ownerWalletAccountId,
          beneficiaryWalletAccountId: operation.beneficiaryWalletAccountId,
          transactionId: operation.transactionTypeId,
          transactionTag: transactionType.tag,
          currencyId: operation.currencyId,
          operationRefId: operation.operationRefId,
        },
        beneficiaryOperation: null,
      };

      await observer.execute(
        message,
        walletAccountRepository,
        operationRepository,
        currencyRepository,
        otcService,
        logger,
      );

      const walletAccount = await WalletAccountModel.findOne({
        where: { id: operation.beneficiaryWalletAccountId },
      });

      expect(walletAccount.averagePrice).toBe(0);
      expect(mockGetConversionByOperation).not.toHaveBeenCalled();
      expect(mockGetCryptoPriceByCurrencyAndDate).not.toHaveBeenCalled();
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should update avg price in wallet account successfully with transaction tag CONV', async () => {
      const transactionType = await TransactionTypeModel.findOne({
        where: { tag: CONVERSION_TRANSACTION_TAG },
      });

      const currencyBtc = await CurrencyModel.findOne({
        where: { tag: BTC_CURRENCY_TAG },
      });

      const operationRef = await OperationFactory.create<OperationModel>(
        OperationModel.name,
        {
          transactionTypeId: transactionType.id,
          value: 10000000, // 100k reais
        },
      );

      const operation = await OperationFactory.create<OperationModel>(
        OperationModel.name,
        {
          transactionTypeId: transactionType.id,
          operationRefId: operationRef.id,
          currencyId: currencyBtc.id,
          value: 100000000, // 1 btc
        },
      );

      await WalletAccountModel.update(
        {
          averagePrice: 20000000, // 200k reais
          balance: 400000000, // 4 btc
        },
        { where: { id: operation.beneficiaryWalletAccountId } },
      );

      const message: HandleCalculateCryptoAvgPriceEventRequest = {
        ownerOperation: null,
        beneficiaryOperation: {
          id: operation.id,
          state: OperationState.ACCEPTED,
          rawValue: operation.rawValue,
          value: operation.value,
          fee: operation.fee,
          ownerRequestedRawValue: operation.ownerRequestedRawValue,
          ownerRequestedFee: operation.ownerRequestedFee,
          description: operation.description,
          ownerId: operation.ownerId,
          beneficiaryId: operation.beneficiaryId,
          ownerWalletAccountId: operation.ownerWalletAccountId,
          beneficiaryWalletAccountId: operation.beneficiaryWalletAccountId,
          transactionId: operation.transactionTypeId,
          transactionTag: transactionType.tag,
          currencyId: operation.currencyId,
          operationRefId: operation.operationRefId,
        },
      };

      await observer.execute(
        message,
        walletAccountRepository,
        operationRepository,
        currencyRepository,
        otcService,
        logger,
      );

      const walletAccount = await WalletAccountModel.findOne({
        where: { id: operation.beneficiaryWalletAccountId },
      });

      // The avg price is calculated by:
      // (last balance (4btc - 1btc) * last avgPrice (200k) + current amount (1btc) * current price (100k) / current balance (4 btc))
      expect(walletAccount.averagePrice).toBe(17500000);
    });

    it('TC0003 - Should update avg price in wallet account successfully with transaction tag CASHBACK', async () => {
      const transactionType = await TransactionTypeModel.findOne({
        where: { tag: CASHBACK_TRANSACTION_TAG },
      });

      const currencyBtc = await CurrencyModel.findOne({
        where: { tag: BTC_CURRENCY_TAG },
      });

      const operation = await OperationFactory.create<OperationModel>(
        OperationModel.name,
        {
          transactionTypeId: transactionType.id,
          currencyId: currencyBtc.id,
          value: 100000000, // 1 btc
        },
      );

      const conversion = await ConversionFactory.create<ConversionEntity>(
        ConversionEntity.name,
        {
          operation,
          usdQuote: 400,
          quote: String(25000), // price = 25k * 4 reais = 100k reais
        },
      );

      mockGetConversionByOperation.mockResolvedValueOnce(conversion);

      await WalletAccountModel.update(
        {
          averagePrice: 20000000, // 200k reais
          balance: 400000000, // 4 btc
        },
        { where: { id: operation.beneficiaryWalletAccountId } },
      );

      const message: HandleCalculateCryptoAvgPriceEventRequest = {
        ownerOperation: null,
        beneficiaryOperation: {
          id: operation.id,
          state: OperationState.ACCEPTED,
          rawValue: operation.rawValue,
          value: operation.value,
          fee: operation.fee,
          ownerRequestedRawValue: operation.ownerRequestedRawValue,
          ownerRequestedFee: operation.ownerRequestedFee,
          description: operation.description,
          ownerId: operation.ownerId,
          beneficiaryId: operation.beneficiaryId,
          ownerWalletAccountId: operation.ownerWalletAccountId,
          beneficiaryWalletAccountId: operation.beneficiaryWalletAccountId,
          transactionId: operation.transactionTypeId,
          transactionTag: transactionType.tag,
          currencyId: operation.currencyId,
          operationRefId: operation.operationRefId,
        },
      };

      await observer.execute(
        message,
        walletAccountRepository,
        operationRepository,
        currencyRepository,
        otcService,
        logger,
      );

      const walletAccount = await WalletAccountModel.findOne({
        where: { id: operation.beneficiaryWalletAccountId },
      });

      // The avg price is calculated by:
      // (last balance (4btc - 1btc) * last avgPrice (200k) + current amount (1btc) * current price (100k) / current balance (4 btc))
      expect(walletAccount.averagePrice).toBe(17500000);
    });

    it('TC0004 - Should update avg price in wallet account successfully with transaction tag P2PBT', async () => {
      const transactionType = await TransactionTypeModel.findOne({
        where: { tag: P2PBT_TRANSACTION_TAG },
      });

      const currencyBtc = await CurrencyModel.findOne({
        where: { tag: BTC_CURRENCY_TAG },
      });

      const operation = await OperationFactory.create<OperationModel>(
        OperationModel.name,
        {
          transactionTypeId: transactionType.id,
          currencyId: currencyBtc.id,
          value: 100000000, // 1 btc
        },
      );

      await WalletAccountModel.update(
        {
          averagePrice: 20000000, // 200k reais
          balance: 400000000, // 4 btc
        },
        { where: { id: operation.beneficiaryWalletAccountId } },
      );

      mockGetCryptoPriceByCurrencyAndDate.mockResolvedValue(10000000); // price = 100k reais

      const message: HandleCalculateCryptoAvgPriceEventRequest = {
        ownerOperation: null,
        beneficiaryOperation: {
          id: operation.id,
          state: OperationState.ACCEPTED,
          rawValue: operation.rawValue,
          value: operation.value,
          fee: operation.fee,
          ownerRequestedRawValue: operation.ownerRequestedRawValue,
          ownerRequestedFee: operation.ownerRequestedFee,
          description: operation.description,
          ownerId: operation.ownerId,
          beneficiaryId: operation.beneficiaryId,
          ownerWalletAccountId: operation.ownerWalletAccountId,
          beneficiaryWalletAccountId: operation.beneficiaryWalletAccountId,
          transactionId: operation.transactionTypeId,
          transactionTag: transactionType.tag,
          currencyId: operation.currencyId,
          operationRefId: operation.operationRefId,
        },
      };

      await observer.execute(
        message,
        walletAccountRepository,
        operationRepository,
        currencyRepository,
        otcService,
        logger,
      );

      const walletAccount = await WalletAccountModel.findOne({
        where: { id: operation.beneficiaryWalletAccountId },
      });

      // The avg price is calculated by:
      // (last balance (4btc - 1btc) * last avgPrice (200k) + current amount (1btc) * current price (100k) / current balance (4 btc))
      expect(walletAccount.averagePrice).toBe(17500000);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
