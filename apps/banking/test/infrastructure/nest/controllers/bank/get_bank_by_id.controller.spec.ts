import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common';
import { BankRepository } from '@zro/banking/domain';
import {
  BankModel,
  GetBankByIdMicroserviceController as Controller,
  BankDatabaseRepository,
} from '@zro/banking/infrastructure';
import { BankFactory } from '@zro/test/banking/config';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { KafkaContext } from '@nestjs/microservices';
import { GetBankByIdRequest } from '@zro/banking/interface';

describe('GetBankByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankRepository: BankRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    bankRepository = new BankDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetBankById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get bank by id successfully', async () => {
        const { id, ispb, name } = await BankFactory.create<BankModel>(
          BankModel.name,
        );

        const message: GetBankByIdRequest = {
          id,
        };

        const result = await controller.execute(
          bankRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(id);
        expect(result.value.ispb).toBe(ispb);
        expect(result.value.name).toBe(name);
        expect(result.value.createdAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
