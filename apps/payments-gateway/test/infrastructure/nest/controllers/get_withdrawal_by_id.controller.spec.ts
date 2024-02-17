import axios from 'axios';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, ForbiddenException } from '@zro/common';
import { PaymentsGatewayException } from '@zro/payments-gateway/application';
import { GetTransactionByIdRequest } from '@zro/payments-gateway/interface';
import {
  GetWithdrawalByIdMicroserviceController as Controller,
  PaymentsGatewayAxiosService,
} from '@zro/payments-gateway/infrastructure';
import { AppModule } from '@zro/payments-gateway/infrastructure/nest/modules/app.module';
import * as MockGetWithdrawalById from '@zro/test/payments-gateway/config/mocks/get_withdrawal_by_id.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('GetWithdrawalByIdMicroserviceController', () => {
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
    it('TC0001 - Should get withdrawal successfully', async () => {
      mockAxios.get.mockImplementationOnce(MockGetWithdrawalById.success);
      mockCreateAxiosService.mockReturnValue(mockAxios);

      const message: GetTransactionByIdRequest = {
        id: faker.datatype.number({ min: 1, max: 99 }),
        wallet_id: faker.datatype.uuid(),
      };

      const result = await controller.execute(logger, message, ctx);

      expect(result).toBeDefined();
      expect(mockCreateAxiosService).toHaveBeenCalledTimes(1);
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get withdrawal after offline response', async () => {
      mockCreateAxiosService.mockReturnValue(mockAxios);
      mockAxios.get.mockImplementationOnce(MockGetWithdrawalById.offline);

      const message: GetTransactionByIdRequest = {
        id: faker.datatype.number({ min: 1, max: 99 }),
        wallet_id: faker.datatype.uuid(),
      };

      const testScript = () => controller.execute(logger, message, ctx);

      await expect(testScript).rejects.toThrow(PaymentsGatewayException);
      expect(mockCreateAxiosService).toHaveBeenCalledTimes(1);
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should not get withdrawal after unauthorized response', async () => {
      mockCreateAxiosService.mockReturnValue(mockAxios);
      mockAxios.get.mockImplementationOnce(MockGetWithdrawalById.unauthorized);

      const message: GetTransactionByIdRequest = {
        id: faker.datatype.number({ min: 1, max: 99 }),
        wallet_id: faker.datatype.uuid(),
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
