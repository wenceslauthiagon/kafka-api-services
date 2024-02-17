import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { BankingTedRepository } from '@zro/banking/domain';
import {
  BankingTedModel,
  GetBankingTedByTransactionIdMicroserviceController as Controller,
  BankingTedDatabaseRepository,
} from '@zro/banking/infrastructure';
import { BankingTedFactory } from '@zro/test/banking/config';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { defaultLogger as logger } from '@zro/common';
import { KafkaContext } from '@nestjs/microservices';
import { GetBankingTedByTransactionIdRequest } from '@zro/banking/interface';

describe('GetBankingTedByTransactionIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankingTedRepository: BankingTedRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    controller = module.get<Controller>(Controller);
    bankingTedRepository = new BankingTedDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetBankingTedByTransactionId', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get bankingTed by id successfully', async () => {
        const bankingTed = await BankingTedFactory.create<BankingTedModel>(
          BankingTedModel.name,
        );

        const message: GetBankingTedByTransactionIdRequest = {
          transactionId: bankingTed.transactionId,
        };

        const result = await controller.execute(
          bankingTedRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.operationId).toBeDefined();
        expect(result.value.beneficiaryBankName).toBeDefined();
        expect(result.value.beneficiaryBankCode).toBeDefined();
        expect(result.value.beneficiaryName).toBeDefined();
        expect(result.value.beneficiaryType).toBeDefined();
        expect(result.value.beneficiaryDocument).toBeDefined();
        expect(result.value.beneficiaryAgency).toBeDefined();
        expect(result.value.beneficiaryAccount).toBeDefined();
        expect(result.value.beneficiaryAccountDigit).toBeDefined();
        expect(result.value.beneficiaryAccountType).toBeDefined();
        expect(result.value.transactionId).toBeDefined();
        expect(result.value.confirmedAt).toBeDefined();
        expect(result.value.failedAt).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
