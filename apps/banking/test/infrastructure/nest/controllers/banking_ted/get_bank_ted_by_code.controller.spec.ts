import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common';
import { BankTedRepository } from '@zro/banking/domain';
import {
  BankTedModel,
  GetBankTedByCodeMicroserviceController as Controller,
  BankTedDatabaseRepository,
} from '@zro/banking/infrastructure';
import { BankTedFactory } from '@zro/test/banking/config';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { KafkaContext } from '@nestjs/microservices';
import { GetBankTedByCodeRequest } from '@zro/banking/interface';

describe('GetBankTedByCodeMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankTedRepository: BankTedRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    bankTedRepository = new BankTedDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetBankTedByCode', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get bankTed by code successfully', async () => {
        const { id, code, name } = await BankTedFactory.create<BankTedModel>(
          BankTedModel.name,
        );

        const message: GetBankTedByCodeRequest = {
          code,
        };

        const result = await controller.execute(
          bankTedRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(id);
        expect(result.value.code).toBe(code);
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
