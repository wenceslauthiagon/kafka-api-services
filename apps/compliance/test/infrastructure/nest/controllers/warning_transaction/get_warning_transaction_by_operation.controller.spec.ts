import { createMock } from 'ts-auto-mock';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { WarningTransactionRepository } from '@zro/compliance/domain';
import {
  GetWarningTransactionByOperationMicroserviceController as Controller,
  WarningTransactionDatabaseRepository,
  WarningTransactionModel,
} from '@zro/compliance/infrastructure';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import { GetWarningTransactionByOperationRequest } from '@zro/compliance/interface';
import { WarningTransactionFactory } from '@zro/test/compliance/config';

describe('GetWarningTransactionByOperationMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let warningTransactionRepository: WarningTransactionRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    controller = module.get<Controller>(Controller);
    warningTransactionRepository = new WarningTransactionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get warning transaction if missing payload values', async () => {
      const message: GetWarningTransactionByOperationRequest = {
        operationId: null,
      };

      const testScript = () =>
        controller.execute(warningTransactionRepository, logger, message, ctx);

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get warning transaction successfully', async () => {
      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionModel>(
          WarningTransactionModel.name,
        );

      const message: GetWarningTransactionByOperationRequest = {
        operationId: warningTransaction.operationId,
      };

      const result = await controller.execute(
        warningTransactionRepository,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.value.id).toEqual(warningTransaction.id);
      expect(result.value.issueId).toEqual(warningTransaction.issueId);
      expect(result.value.status).toEqual(warningTransaction.status);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
