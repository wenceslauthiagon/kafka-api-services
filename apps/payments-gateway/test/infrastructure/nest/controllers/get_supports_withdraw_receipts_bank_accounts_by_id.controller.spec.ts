import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, ForbiddenException } from '@zro/common';
import { PaymentsGatewayException } from '@zro/payments-gateway/application';
import { AppModule } from '@zro/payments-gateway/infrastructure/nest/modules/app.module';
import {
  GetSupportsWithdrawReceiptsBankAccountsByIdMicroserviceController as Controller,
  PaymentsGatewayAxiosService,
} from '@zro/payments-gateway/infrastructure';
import * as MockGetSupportsWithdrawReceipts from '@zro/test/payments-gateway/config/mocks/get_supports_withdraw_receipts_bank_accounts_by_id.mock';
import {
  GetRefundReceiptsBankAccountsRequest,
  GetWithdrawReceiptsBankAccountsRequest,
} from '@zro/payments-gateway/interface';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('GetSupportsWithdrawReceiptsBankAccountsByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;

  const ctx: KafkaContext = createMock<KafkaContext>();
  const paymentsGatewayAxiosService: PaymentsGatewayAxiosService =
    createMock<PaymentsGatewayAxiosService>();
  const mockCreateAxiosService: jest.Mock = On(paymentsGatewayAxiosService).get(
    method((mock) => mock.create),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PaymentsGatewayAxiosService)
      .useValue(paymentsGatewayAxiosService)
      .compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should get support successfully', async () => {
      mockCreateAxiosService.mockReturnValue(mockAxios);
      mockAxios.get.mockImplementationOnce(
        MockGetSupportsWithdrawReceipts.success,
      );

      const message: GetWithdrawReceiptsBankAccountsRequest = {
        wallet_id: uuidV4(),
        bank_account_id: 1,
        end_to_end: 'E1954055020230831164544568757715',
      };

      const result = await controller.execute(logger, message, ctx);

      expect(result).toBeDefined();
      expect(mockCreateAxiosService).toHaveBeenCalledTimes(1);
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get withdrawals after offline response', async () => {
      mockCreateAxiosService.mockReturnValue(mockAxios);
      mockAxios.get.mockImplementationOnce(
        MockGetSupportsWithdrawReceipts.offline,
      );

      const message: GetRefundReceiptsBankAccountsRequest = {
        wallet_id: uuidV4(),
        bank_account_id: 1,
        end_to_end: 'E1954055020230831164544568757715',
      };

      const testScript = () => controller.execute(logger, message, ctx);

      await expect(testScript).rejects.toThrow(PaymentsGatewayException);
      expect(mockCreateAxiosService).toHaveBeenCalledTimes(1);
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should not get withdrawals after unauthorized response', async () => {
      mockCreateAxiosService.mockReturnValue(mockAxios);
      mockAxios.get.mockImplementationOnce(
        MockGetSupportsWithdrawReceipts.unauthorized,
      );

      const message: GetRefundReceiptsBankAccountsRequest = {
        wallet_id: uuidV4(),
        bank_account_id: 1,
        end_to_end: 'E1954055020230831164544568757715',
      };
      const testScript = () => controller.execute(logger, message, ctx);

      await expect(testScript).rejects.toThrow(ForbiddenException);
      expect(mockCreateAxiosService).toHaveBeenCalledTimes(1);
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
