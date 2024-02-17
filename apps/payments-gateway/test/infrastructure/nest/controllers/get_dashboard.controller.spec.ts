import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { ForbiddenException, defaultLogger as logger } from '@zro/common';
import { PaymentsGatewayException } from '@zro/payments-gateway/application';
import { GetDashboardRequest } from '@zro/payments-gateway/interface';
import {
  GetDashboardMicroserviceController as Controller,
  PaymentsGatewayAxiosService,
} from '@zro/payments-gateway/infrastructure';
import { AppModule } from '@zro/payments-gateway/infrastructure/nest/modules/app.module';
import * as MockGetDashboard from '@zro/test/payments-gateway/config/mocks/get_dashboard.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('GetDashboardMicroserviceController', () => {
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
    it('TC0001 - Should get dashboard successfully', async () => {
      mockCreateAxiosService.mockReturnValue(mockAxios);
      mockAxios.get.mockImplementationOnce(MockGetDashboard.success);

      const message: GetDashboardRequest = {
        wallet_id: uuidV4(),
      };

      const result = await controller.execute(logger, message, ctx);

      expect(result).toBeDefined();
      expect(mockCreateAxiosService).toHaveBeenCalledTimes(1);
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get dashboard after offline response', async () => {
      mockCreateAxiosService.mockReturnValue(mockAxios);
      mockAxios.get.mockImplementationOnce(MockGetDashboard.offline);

      const message: GetDashboardRequest = {
        wallet_id: uuidV4(),
      };

      const testScript = () => controller.execute(logger, message, ctx);

      await expect(testScript).rejects.toThrow(PaymentsGatewayException);
      expect(mockCreateAxiosService).toHaveBeenCalledTimes(1);
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should not get dashboard after unauthorized response', async () => {
      mockCreateAxiosService.mockReturnValue(mockAxios);
      mockAxios.get.mockImplementationOnce(MockGetDashboard.unauthorized);

      const message: GetDashboardRequest = {
        wallet_id: uuidV4(),
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
