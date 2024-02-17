import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, RedisService } from '@zro/common';
import { AppModule } from '@zro/pix-zro-pay/infrastructure/nest/modules/app.module';
import {
  CreateQrCodeMicroserviceController as Controller,
  BankAccountDatabaseRepository,
  ClientDatabaseRepository,
  CompanyDatabaseRepository,
  PlanDatabaseRepository,
  CompanyPolicyDatabaseRepository,
  CompanyModel,
  ClientModel,
  PlanModel,
  UserModel,
  BankAccountModel,
  CompanyPolicyModel,
} from '@zro/pix-zro-pay/infrastructure';
import {
  CreateQrCodeRequest,
  QrCodeEventEmitterControllerInterface,
} from '@zro/pix-zro-pay/interface';
import { KafkaContext } from '@nestjs/microservices';
import {
  CompanyFactory,
  ClientFactory,
  PlanFactory,
  UserFactory,
  CompanyPolicyFactory,
  BankAccountFactory,
} from '@zro/test/pix-zro-pay/config';
import { BankAccountName, QrCodeState } from '@zro/pix-zro-pay/domain';
import { CompanyNotFoundException } from '@zro/pix-zro-pay/application';

describe('CreateQrCodeMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankAccountDatabaseRepository: BankAccountDatabaseRepository;
  let clientDatabaseRepository: ClientDatabaseRepository;
  let companyDatabaseRepository: CompanyDatabaseRepository;
  let companyPolicyDatabaseRepository: CompanyPolicyDatabaseRepository;
  let planDatabaseRepository: PlanDatabaseRepository;

  const eventEmitter: QrCodeEventEmitterControllerInterface =
    createMock<QrCodeEventEmitterControllerInterface>();
  const mockEmitQrCodeStaticEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitQrCodeEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();
  const redisService: RedisService = createMock<RedisService>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RedisService)
      .useValue(redisService)
      .compile();

    controller = module.get<Controller>(Controller);

    bankAccountDatabaseRepository = new BankAccountDatabaseRepository();
    clientDatabaseRepository = new ClientDatabaseRepository();
    companyDatabaseRepository = new CompanyDatabaseRepository();
    companyPolicyDatabaseRepository = new CompanyPolicyDatabaseRepository();
    planDatabaseRepository = new PlanDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateQrCode', () => {
    it('TC0001 - Should create qrCode successfully', async () => {
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
      await CompanyPolicyFactory.create<CompanyPolicyModel>(
        CompanyPolicyModel.name,
        { companyId: company.id },
      );

      const client = await ClientFactory.create<ClientModel>(ClientModel.name, {
        companyId: company.id,
      });

      const fakeMessage: CreateQrCodeRequest = {
        clientDocument: client.document,
        clientName: client.name,
        companyId: company.id,
        merchantId: faker.datatype.uuid(),
        description: faker.datatype.string(),
        expirationInSeconds: faker.datatype.number(),
        value: faker.datatype.number(100),
      };

      const spy = jest.spyOn(controller, 'onModuleInit');
      spy.mockImplementation(() => {
        Object.defineProperty(controller, 'pspGateways', {
          value: [
            {
              getProviderName: () => {
                return BankAccountName.BANK_ZRO_BANK;
              },
              createQrCode: () => ({
                id: faker.datatype.uuid(),
                txId: faker.datatype.uuid(),
                emv: faker.datatype.string(),
                expirationDate: faker.datatype.string(),
              }),
              getQrCodeById: () => ({
                txId: faker.datatype.uuid(),
                emv: faker.datatype.string(),
                expirationDate: faker.datatype.string(),
                state: QrCodeState.READY,
              }),
            },
          ],
        });
        return Promise.resolve(null);
      });
      await controller.onModuleInit();
      const result = await controller.execute(
        bankAccountDatabaseRepository,
        clientDatabaseRepository,
        companyDatabaseRepository,
        companyPolicyDatabaseRepository,
        planDatabaseRepository,
        eventEmitter,
        logger,
        fakeMessage,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.value.emv).toBeDefined();
      expect(result.value.txId).toBeDefined();
      expect(result.value.transactionUuid).toBeDefined();
      expect(result.value.merchantId).toBeDefined();
      expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should throw error on failure', async () => {
      const fakeMessage: CreateQrCodeRequest = {
        clientDocument: faker.datatype.string(),
        clientName: faker.datatype.string(),
        companyId: faker.datatype.number(),
        merchantId: faker.datatype.uuid(),
        description: faker.datatype.string(),
        expirationInSeconds: faker.datatype.number(),
        value: faker.datatype.number(100),
      };

      await controller.onModuleInit();
      const result = controller.execute(
        bankAccountDatabaseRepository,
        clientDatabaseRepository,
        companyDatabaseRepository,
        companyPolicyDatabaseRepository,
        planDatabaseRepository,
        eventEmitter,
        logger,
        fakeMessage,
        ctx,
      );

      await expect(result).rejects.toThrow(CompanyNotFoundException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
