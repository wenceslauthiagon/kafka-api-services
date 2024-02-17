import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  TransactionTypeRepository,
  TransactionTypeState,
} from '@zro/operations/domain';
import {
  GetActiveTransactionTypeByTagMicroserviceController as Controller,
  TransactionTypeDatabaseRepository,
  TransactionTypeModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { TransactionTypeFactory } from '@zro/test/operations/config';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { KafkaContext } from '@nestjs/microservices';
import { GetActiveTransactionTypeByTagRequest } from '@zro/operations/interface';

describe('GetActiveTransactionTypeByTagMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let transactionTypeRepository: TransactionTypeRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    transactionTypeRepository = new TransactionTypeDatabaseRepository();
  });

  describe('GetActiveTransactionTypeByTag', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not get if missing params', async () => {
        const message: GetActiveTransactionTypeByTagRequest = {
          tag: null,
        };

        const test = () =>
          controller.execute(transactionTypeRepository, logger, message, ctx);

        await expect(test).rejects.toThrow(InvalidDataFormatException);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should get by tag successfully', async () => {
        const tag = faker.datatype.string(5);

        const transactionType =
          await TransactionTypeFactory.create<TransactionTypeModel>(
            TransactionTypeModel.name,
            { tag, state: TransactionTypeState.ACTIVE },
          );

        await TransactionTypeFactory.create<TransactionTypeModel>(
          TransactionTypeModel.name,
          { tag, state: TransactionTypeState.DEACTIVATE },
        );

        const message: GetActiveTransactionTypeByTagRequest = {
          tag: tag,
        };

        const result = await controller.execute(
          transactionTypeRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(transactionType.id);
        expect(result.value.tag).toBe(transactionType.tag);
        expect(result.value.title).toBe(transactionType.title);
        expect(result.value.participants).toBe(transactionType.participants);
        expect(result.value.state).toBe(transactionType.state);
      });

      it('TC0003 - Should not get if not found', async () => {
        const message: GetActiveTransactionTypeByTagRequest = {
          tag: faker.datatype.string(5),
        };

        const result = await controller.execute(
          transactionTypeRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value).toBeNull();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
