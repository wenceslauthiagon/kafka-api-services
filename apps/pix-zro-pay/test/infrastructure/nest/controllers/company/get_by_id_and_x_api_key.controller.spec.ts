import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { AppModule } from '@zro/pix-zro-pay/infrastructure/nest/modules/app.module';
import {
  GetCompanyByIdAndXApiKeyMicroserviceController as Controller,
  CompanyDatabaseRepository,
  CompanyModel,
  PlanModel,
  UserModel,
  BankAccountModel,
} from '@zro/pix-zro-pay/infrastructure';
import { GetCompanyByIdAndXApiKeyRequest } from '@zro/pix-zro-pay/interface';
import { KafkaContext } from '@nestjs/microservices';
import {
  BankAccountFactory,
  CompanyFactory,
  PlanFactory,
  UserFactory,
} from '@zro/test/pix-zro-pay/config';

describe('GetCompanyByIdAndXApiKeyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let companyDatabaseRepository: CompanyDatabaseRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    companyDatabaseRepository = new CompanyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetCompanyByIdAndXApiKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get company successfully', async () => {
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

        const fakeMessage: GetCompanyByIdAndXApiKeyRequest = {
          id: company.id,
          xApiKey: company.xApiKey,
        };

        const result = await controller.execute(
          companyDatabaseRepository,
          logger,
          fakeMessage,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not get if invalid parameters', async () => {
        const message: GetCompanyByIdAndXApiKeyRequest = {
          id: null,
          xApiKey: null,
        };

        const testScript = () =>
          controller.execute(companyDatabaseRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
