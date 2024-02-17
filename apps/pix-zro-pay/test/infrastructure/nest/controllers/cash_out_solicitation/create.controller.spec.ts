import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';

import { AppModule } from '@zro/pix-zro-pay/infrastructure/nest/modules/app.module';
import { KafkaContext } from '@nestjs/microservices';
import {
  BankAccountDatabaseRepository,
  CashOutSolicitationDatabaseRepository,
  CompanyDatabaseRepository,
  CreateCashOutSolicitationMicroserviceController as Controller,
  UserDatabaseRepository,
} from '@zro/pix-zro-pay/infrastructure';
import {
  BankAccountRepository,
  CashOutSolicitationEntity,
  CashOutSolicitationRepository,
  CompanyRepository,
  UserRepository,
} from '@zro/pix-zro-pay/domain';
import { CreateCashOutSolicitationRequest } from '@zro/pix-zro-pay/interface';
import { CashOutSolicitationFactory } from '@zro/test/pix-zro-pay/config/factories/cash_out_solicitation.factory';

describe('CreateCashOutSolicitationMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let cashOutSolicitationRepository: CashOutSolicitationRepository;
  let companyRepository: CompanyRepository;
  let bankAccountRepository: BankAccountRepository;
  let userRepository: UserRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    cashOutSolicitationRepository = new CashOutSolicitationDatabaseRepository();
    companyRepository = new CompanyDatabaseRepository();
    bankAccountRepository = new BankAccountDatabaseRepository();
    userRepository = new UserDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateDevolution', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should create cash out solicitation ', async () => {
        const {
          valueCents,
          paymentDate,
          financialEmail,
          responsibleUserObservation,
          providerHolderName,
          providerHolderCnpj,
          providerBankName,
          providerBankBranch,
          providerBankAccountNumber,
          providerBankIspb,
          providerBankAccountType,
        } = await CashOutSolicitationFactory.create<CashOutSolicitationEntity>(
          CashOutSolicitationEntity.name,
        );
        const requestParams: CreateCashOutSolicitationRequest = {
          valueCents,
          paymentDate,
          financialEmail,
          responsibleUserObservation,
          providerHolderName,
          providerHolderCnpj,
          providerBankName,
          providerBankBranch,
          providerBankAccountNumber,
          providerBankIspb,
          providerBankAccountType,
          companyId: 1,
        };

        const result = await controller.execute(
          cashOutSolicitationRepository,
          companyRepository,
          bankAccountRepository,
          userRepository,
          logger,
          requestParams,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBeDefined();

        expect(result.value.valueCents).toBe(requestParams.valueCents);
        expect(result.value.paymentDate).toBe(requestParams.paymentDate);
        expect(result.value.financialEmail).toBe(requestParams.financialEmail);
        expect(result.value.responsibleUserObservation).toBe(
          requestParams.responsibleUserObservation,
        );
        expect(result.value.providerHolderName).toBe(
          requestParams.providerHolderName,
        );
        expect(result.value.providerHolderCnpj).toBe(
          requestParams.providerHolderCnpj,
        );
        expect(result.value.providerBankName).toBe(
          requestParams.providerBankName,
        );
        expect(result.value.providerBankBranch).toBe(
          requestParams.providerBankBranch,
        );
        expect(result.value.providerBankAccountNumber).toBe(
          requestParams.providerBankAccountNumber,
        );
        expect(result.value.providerBankIspb).toBe(
          requestParams.providerBankIspb,
        );
        expect(result.value.providerBankAccountType).toBe(
          requestParams.providerBankAccountType,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
