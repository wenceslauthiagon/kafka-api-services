import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, ForbiddenException } from '@zro/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsGatewayException } from '@zro/payments-gateway/application';
import { GetValidationClientKycCountRequest } from '@zro/payments-gateway/interface';
import { AppModule } from '@zro/payments-gateway/infrastructure/nest/modules/app.module';
import {
  GetValidationClientKycCountMicroserviceController as Controller,
  PaymentsGatewayAxiosService,
} from '@zro/payments-gateway/infrastructure';
import * as MockGetValidationClientKycCount from '@zro/test/payments-gateway/config/mocks/get_validation_client_kyc_count.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('GetValidationClientKycCountMicroserviceController', () => {
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
    it('TC0001 - Should get validation client kyc count successfully', async () => {
      mockCreateAxiosService.mockReturnValue(mockAxios);
      mockAxios.get.mockImplementationOnce(
        MockGetValidationClientKycCount.success,
      );

      const message: GetValidationClientKycCountRequest = {
        wallet_id: uuidV4(),
        company: '1',
        end_date: '2021-01-01',
        start_date: '2021-01-01',
      };

      const result = await controller.execute(logger, message, ctx);

      expect(result).toBeDefined();
      expect(mockCreateAxiosService).toHaveBeenCalledTimes(1);
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get validation client kyc count after offline response', async () => {
      mockCreateAxiosService.mockReturnValue(mockAxios);
      mockAxios.get.mockImplementationOnce(
        MockGetValidationClientKycCount.offline,
      );

      const message: GetValidationClientKycCountRequest = {
        wallet_id: uuidV4(),
        company: '1',
        end_date: '2021-01-01',
        start_date: '2021-01-01',
      };

      const testScript = () => controller.execute(logger, message, ctx);

      await expect(testScript).rejects.toThrow(PaymentsGatewayException);
      expect(mockCreateAxiosService).toHaveBeenCalledTimes(1);
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should not get validation client kyc count after unauthorized response', async () => {
      mockCreateAxiosService.mockReturnValue(mockAxios);
      mockAxios.get.mockImplementationOnce(
        MockGetValidationClientKycCount.unauthorized,
      );

      const message: GetValidationClientKycCountRequest = {
        wallet_id: uuidV4(),
        company: '1',
        end_date: '2021-01-01',
        start_date: '2021-01-01',
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
