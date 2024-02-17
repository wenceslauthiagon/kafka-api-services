import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { BankingTedReceivedRepository } from '@zro/banking/domain';
import {
  BankingTedReceivedModel,
  GetBankingTedReceivedByOperationMicroserviceController as Controller,
  BankingTedReceivedDatabaseRepository,
} from '@zro/banking/infrastructure';
import { BankingTedReceivedFactory } from '@zro/test/banking/config';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { defaultLogger as logger } from '@zro/common';
import { KafkaContext } from '@nestjs/microservices';
import { GetBankingTedReceivedByOperationRequest } from '@zro/banking/interface';

describe('GetBankingTedReceivedByOperationMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankingTedReceivedRepository: BankingTedReceivedRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    controller = module.get<Controller>(Controller);
    bankingTedReceivedRepository = new BankingTedReceivedDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetBankingTedReceivedByOperation', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get BankingTedReceived by id successfully', async () => {
        const bankingTedReceived =
          await BankingTedReceivedFactory.create<BankingTedReceivedModel>(
            BankingTedReceivedModel.name,
          );

        const message: GetBankingTedReceivedByOperationRequest = {
          operationId: bankingTedReceived.operationId,
        };

        const result = await controller.execute(
          bankingTedReceivedRepository,
          logger,
          message,
          ctx,
        );

        expect(result.value.id).toBe(bankingTedReceived.id);
        expect(result.value.operationId).toBe(bankingTedReceived.operationId);
        expect(result.value.transactionId).toBe(
          bankingTedReceived.transactionId,
        );
        expect(result.value.ownerName).toBe(bankingTedReceived.ownerName);
        expect(result.value.ownerDocument).toBe(
          bankingTedReceived.ownerDocument,
        );
        expect(result.value.ownerBankAccount).toBe(
          bankingTedReceived.ownerBankAccount,
        );
        expect(result.value.ownerBankBranch).toBe(
          bankingTedReceived.ownerBankBranch,
        );
        expect(result.value.ownerBankCode).toBe(
          bankingTedReceived.ownerBankCode,
        );
        expect(result.value.ownerBankName).toBe(
          bankingTedReceived.ownerBankName,
        );
        expect(result.value.bankStatementId).toBe(
          bankingTedReceived.bankStatementId,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
