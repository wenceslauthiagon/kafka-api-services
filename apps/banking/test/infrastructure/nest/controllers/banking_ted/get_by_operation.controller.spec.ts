import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { BankingTedRepository } from '@zro/banking/domain';
import {
  BankingTedModel,
  GetBankingTedByOperationMicroserviceController as Controller,
  BankingTedDatabaseRepository,
} from '@zro/banking/infrastructure';
import { BankingTedFactory } from '@zro/test/banking/config';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { defaultLogger as logger } from '@zro/common';
import { KafkaContext } from '@nestjs/microservices';
import { GetBankingTedByOperationRequest } from '@zro/banking/interface';

describe('GetBankingTedByOperationMicroserviceController', () => {
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

  describe('GetBankingTedByOperation', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get BankingTed by id successfully', async () => {
        const bankingTed = await BankingTedFactory.create<BankingTedModel>(
          BankingTedModel.name,
        );

        const message: GetBankingTedByOperationRequest = {
          operationId: bankingTed.operationId,
        };

        const result = await controller.execute(
          bankingTedRepository,
          logger,
          message,
          ctx,
        );

        expect(result.value.id).toBe(bankingTed.id);
        expect(result.value.operationId).toBe(bankingTed.operationId);
        expect(result.value.amount).toBe(bankingTed.amount);
        expect(result.value.state).toBe(bankingTed.state);
        expect(result.value.transactionId).toBe(bankingTed.transactionId);
        expect(result.value.beneficiaryBankName).toBe(
          bankingTed.beneficiaryBankName,
        );
        expect(result.value.beneficiaryBankCode).toBe(
          bankingTed.beneficiaryBankCode,
        );
        expect(result.value.beneficiaryName).toBe(bankingTed.beneficiaryName);
        expect(result.value.beneficiaryType).toBe(bankingTed.beneficiaryType);
        expect(result.value.beneficiaryDocument).toBe(
          bankingTed.beneficiaryDocument,
        );
        expect(result.value.beneficiaryAgency).toBe(
          bankingTed.beneficiaryAgency,
        );
        expect(result.value.beneficiaryAccount).toBe(
          bankingTed.beneficiaryAccount,
        );
        expect(result.value.beneficiaryAccountDigit).toBe(
          bankingTed.beneficiaryAccountDigit,
        );
        expect(result.value.beneficiaryAccountType).toBe(
          bankingTed.beneficiaryAccountType,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
