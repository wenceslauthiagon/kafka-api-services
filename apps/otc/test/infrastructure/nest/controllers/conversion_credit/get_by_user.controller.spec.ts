import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common/test';
import { OrderSide } from '@zro/otc/domain';
import {
  CurrencyEntity,
  UserLimitEntity,
  WalletAccountEntity,
  WalletAccountState,
  WalletEntity,
} from '@zro/operations/domain';
import { QuotationEntity } from '@zro/quotations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  GetConversionCreditByUserMicroserviceController as Controller,
  OperationServiceKafka,
  QuotationServiceKafka,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import {
  CurrencyFactory,
  UserLimitFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import { QuotationFactory } from '@zro/test/quotations/config';
import { UserFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetConversionCreditByUserRequest } from '@zro/otc/interface';

describe('GetConversionCreditByUserMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetWalletAccountByUserAndCurrency: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.getWalletAccountByWalletAndCurrency));
  const mockGetLimitTypesByFilter: jest.Mock = On(operationService).get(
    method((mock) => mock.getLimitTypesByFilter),
  );
  const mockGetUserLimitsByFilter: jest.Mock = On(operationService).get(
    method((mock) => mock.getUserLimitsByFilter),
  );
  const mockGetAllActiveCurrencies: jest.Mock = On(operationService).get(
    method((mock) => mock.getAllActiveCurrencies),
  );
  const mockGetWalletsByUser: jest.Mock = On(operationService).get(
    method((mock) => mock.getWalletsByUser),
  );

  const quotationService: QuotationServiceKafka =
    createMock<QuotationServiceKafka>();
  const mockGetQuotation: jest.Mock = On(quotationService).get(
    method((mock) => mock.getQuotation),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(jest.resetAllMocks);

  describe('Get Conversion credit', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get conversion credit successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );
        const quotation = await QuotationFactory.create<QuotationEntity>(
          QuotationEntity.name,
          { side: OrderSide.BUY, quoteAmountBuy: 1000 },
        );
        const walletAccount =
          await WalletAccountFactory.create<WalletAccountEntity>(
            WalletAccountEntity.name,
            { balance: -1000, state: WalletAccountState.ACTIVE },
          );
        const userLimit = await UserLimitFactory.create<UserLimitEntity>(
          UserLimitEntity.name,
          { creditBalance: 50000 },
        );
        const wallet = await WalletFactory.create<WalletEntity>(
          WalletEntity.name,
        );

        mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);
        mockGetLimitTypesByFilter.mockResolvedValue([{}]);
        mockGetUserLimitsByFilter.mockResolvedValue([userLimit]);
        mockGetAllActiveCurrencies.mockResolvedValueOnce([currency]);
        mockGetQuotation.mockResolvedValueOnce(quotation);
        mockGetWalletsByUser.mockResolvedValue([wallet]);

        const message: GetConversionCreditByUserRequest = {
          userId: user.uuid,
        };

        const result = await controller.execute(
          operationService,
          quotationService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.creditBalance).toBeDefined();
        expect(result.value.liability).toBe(1000);
        expect(result.value.userId).toBe(user.uuid);
        expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(1);
        expect(mockGetLimitTypesByFilter).toHaveBeenCalledTimes(1);
        expect(mockGetUserLimitsByFilter).toHaveBeenCalledTimes(1);
        expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
        expect(mockGetQuotation).toHaveBeenCalledTimes(1);
        expect(mockGetWalletsByUser).toHaveBeenCalledTimes(1);
      });

      it('TC0002 - Should not get any conversion credit with inactive walletAccount', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );
        const walletAccount =
          await WalletAccountFactory.create<WalletAccountEntity>(
            WalletAccountEntity.name,
          );
        const wallet = await WalletFactory.create<WalletEntity>(
          WalletEntity.name,
        );

        mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);
        mockGetLimitTypesByFilter.mockResolvedValue([]);
        mockGetAllActiveCurrencies.mockResolvedValueOnce([currency]);
        mockGetWalletsByUser.mockResolvedValue([wallet]);

        const message: GetConversionCreditByUserRequest = {
          userId: user.uuid,
        };

        const result = await controller.execute(
          operationService,
          quotationService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.creditBalance).toBeDefined();
        expect(result.value.liability).toBe(0);
        expect(result.value.userId).toBe(user.uuid);
        expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(1);
        expect(mockGetLimitTypesByFilter).toHaveBeenCalledTimes(1);
        expect(mockGetUserLimitsByFilter).toHaveBeenCalledTimes(0);
        expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
        expect(mockGetQuotation).toHaveBeenCalledTimes(0);
        expect(mockGetWalletsByUser).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
