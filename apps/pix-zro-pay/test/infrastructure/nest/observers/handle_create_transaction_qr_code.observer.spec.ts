import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  BankAccountEntity,
  ClientEntity,
  CompanyEntity,
  PlanEntity,
  PlanRepository,
  TransactionRepository,
  UserEntity,
} from '@zro/pix-zro-pay/domain';
import { AppModule } from '@zro/pix-zro-pay/infrastructure/nest/modules/app.module';
import {
  BankAccountModel,
  ClientModel,
  CompanyModel,
  CreateTransactionQrCodeNestObserver as Observer,
  PlanDatabaseRepository,
  PlanModel,
  TransactionDatabaseRepository,
  UserModel,
} from '@zro/pix-zro-pay/infrastructure';
import { HandleCreateTransactionQrCodeEventRequest } from '@zro/pix-zro-pay/interface';
import {
  BankAccountFactory,
  ClientFactory,
  CompanyFactory,
  PlanFactory,
  UserFactory,
} from '@zro/test/pix-zro-pay/config';

describe('CreateWarningPixDevolutionNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let transactionRepository: TransactionRepository;
  let planRepository: PlanRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<Observer>(Observer);
    transactionRepository = new TransactionDatabaseRepository();
    planRepository = new PlanDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create transaction with missing params', async () => {
      const plan = await PlanFactory.create<PlanEntity>(PlanEntity.name);
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const bankAccount = await BankAccountFactory.create<BankAccountEntity>(
        BankAccountEntity.name,
      );
      const company = await CompanyFactory.create<CompanyEntity>(
        CompanyEntity.name,
        {
          plan: plan,
          responsible: user,
          activeBankForCashIn: bankAccount,
          activeBankForCashOut: bankAccount,
        },
      );
      const client = await ClientFactory.create<ClientEntity>(
        ClientEntity.name,
        { company },
      );

      const message: HandleCreateTransactionQrCodeEventRequest = {
        transactionUuid: null,
        txId: faker.datatype.uuid(),
        description: faker.datatype.string(),
        payerDocument: faker.datatype.number(),
        emv: faker.datatype.uuid(),
        expirationDate: faker.datatype.string(),
        value: faker.datatype.number(),
        company,
        bankAccount,
        client,
        merchantId: faker.datatype.uuid(),
        createdAt: faker.datatype.datetime(),
      };

      const testScript = () =>
        controller.execute(
          message,
          transactionRepository,
          planRepository,
          logger,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should create transaction successfully', async () => {
      const plan = await PlanFactory.create<PlanModel>(PlanModel.name);
      const user = await UserFactory.create<UserModel>(UserModel.name);
      const bankAccount = await BankAccountFactory.create<BankAccountModel>(
        BankAccountModel.name,
      );
      const company = await CompanyFactory.create<CompanyModel>(
        CompanyModel.name,
        {
          planId: plan.id,
          responsibleId: user.id,
          activeBankForCashInId: bankAccount.id,
          activeBankForCashOutId: bankAccount.id,
        },
      );
      const client = await ClientFactory.create<ClientModel>(ClientModel.name, {
        companyId: company.id,
      });
      Object.assign(company, { plan });

      const message: HandleCreateTransactionQrCodeEventRequest = {
        transactionUuid: faker.datatype.uuid(),
        txId: faker.datatype.uuid(),
        description: faker.datatype.string(),
        payerDocument: faker.datatype.number(),
        emv: faker.datatype.uuid(),
        expirationDate: faker.datatype.string(),
        value: faker.datatype.number(),
        company,
        bankAccount,
        client,
        merchantId: faker.datatype.uuid(),
        createdAt: faker.datatype.datetime(),
      };

      const spy = jest.spyOn(transactionRepository, 'create');
      const spyGetById = jest.spyOn(planRepository, 'getById');

      await controller.execute(
        message,
        transactionRepository,
        planRepository,
        logger,
      );

      expect(spyGetById).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
