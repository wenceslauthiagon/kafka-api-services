import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  WarningTransactionEntity,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import {
  CreateWarningTransactionMicroserviceController as Controller,
  WarningTransactionDatabaseRepository,
} from '@zro/compliance/infrastructure';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import { WarningTransactionFactory } from '@zro/test/compliance/config';
import {
  CreateWarningTransactionRequest,
  WarningTransactionEventEmitterControllerInterface,
} from '@zro/compliance/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('CreateWarningTransactionMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let warningTransactionRepository: WarningTransactionRepository;

  const eventEmitterController: WarningTransactionEventEmitterControllerInterface =
    createMock<WarningTransactionEventEmitterControllerInterface>();
  const emitWarningTransactionEvent: jest.Mock = On(eventEmitterController).get(
    method((mock) => mock.emitWarningTransactionEvent),
  );

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
    it('TC0001 - Should not create warning transaction if missing payload values', async () => {
      const message: CreateWarningTransactionRequest = {
        operationId: null,
        transactionTag: null,
        endToEndId: faker.datatype.uuid(),
      };

      const testScript = () =>
        controller.execute(
          warningTransactionRepository,
          eventEmitterController,
          logger,
          message,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);

      expect(emitWarningTransactionEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should create warning transaction successfully', async () => {
      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
        );

      const message: CreateWarningTransactionRequest = {
        operationId: warningTransaction.operation.id,
        transactionTag: warningTransaction.transactionTag,
        endToEndId: warningTransaction.endToEndId,
      };

      const result = await controller.execute(
        warningTransactionRepository,
        eventEmitterController,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.value.operation).toEqual(warningTransaction.operation);
      expect(result.value.transactionTag).toEqual(
        warningTransaction.transactionTag,
      );
      expect(result.value.status).toBe(warningTransaction.status);
      expect(emitWarningTransactionEvent).toHaveBeenCalledTimes(1);
      expect(result.value.id).toBeDefined();
      expect(result.value.status).toBe(WarningTransactionStatus.PENDING);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
