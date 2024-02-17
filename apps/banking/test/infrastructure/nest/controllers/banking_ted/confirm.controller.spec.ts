import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger } from '@zro/common';
import { AccountType } from '@zro/pix-payments/domain';
import { BankingTedState, AdminBankingTedState } from '@zro/banking/domain';
import { BankingTedNotFoundException } from '@zro/banking/application';
import {
  BankingTedEventEmitterControllerInterface,
  AdminBankingTedEventEmitterControllerInterface,
  ConfirmBankingTedRequest,
} from '@zro/banking/interface';
import {
  ConfirmBankingTedMicroserviceController as Controller,
  BankingTedDatabaseRepository,
  AdminBankingTedDatabaseRepository,
  AdminBankingAccountDatabaseRepository,
  BankingTedModel,
  AdminBankingTedModel,
  AdminBankingAccountModel,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import {
  BankingTedFactory,
  AdminBankingTedFactory,
  AdminBankingAccountFactory,
} from '@zro/test/banking/config';
import { KafkaContext } from '@nestjs/microservices';

describe('ConfirmBankingTedMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankingTedRepository: BankingTedDatabaseRepository;
  let adminBankingTedRepository: AdminBankingTedDatabaseRepository;
  let adminBankingAccountRepository: AdminBankingAccountDatabaseRepository;

  const bankingTedEmitter: BankingTedEventEmitterControllerInterface =
    createMock<BankingTedEventEmitterControllerInterface>();
  const mockEmitBankingTedStaticEvent: jest.Mock = On(bankingTedEmitter).get(
    method((mock) => mock.emitBankingTedEvent),
  );

  const adminBankingTedEmitter: AdminBankingTedEventEmitterControllerInterface =
    createMock<AdminBankingTedEventEmitterControllerInterface>();
  const mockEmitAdminBankingTedStaticEvent: jest.Mock = On(
    adminBankingTedEmitter,
  ).get(method((mock) => mock.emitAdminBankingTedEvent));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    bankingTedRepository = new BankingTedDatabaseRepository();
    adminBankingTedRepository = new AdminBankingTedDatabaseRepository();
    adminBankingAccountRepository = new AdminBankingAccountDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('ConfirmBankingTed', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should confirm successfully', async () => {
        const bankingTed = await BankingTedFactory.create<BankingTedModel>(
          BankingTedModel.name,
          { state: BankingTedState.WAITING, beneficiaryAccountDigit: '' },
        );

        const message: ConfirmBankingTedRequest = {
          transactionId: bankingTed.transactionId,
          beneficiaryDocument: bankingTed.beneficiaryDocument,
          beneficiaryBankCode: bankingTed.beneficiaryBankCode,
          beneficiaryAgency: bankingTed.beneficiaryAgency,
          beneficiaryAccount: bankingTed.beneficiaryAccount,
          beneficiaryAccountType: bankingTed.beneficiaryAccountType,
          amount: bankingTed.amount,
        };

        const result = await controller.execute(
          bankingTedRepository,
          adminBankingAccountRepository,
          adminBankingTedRepository,
          bankingTedEmitter,
          adminBankingTedEmitter,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
        expect(mockEmitBankingTedStaticEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitBankingTedStaticEvent.mock.calls[0][0]).toBe(
          BankingTedState.CONFIRMED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - should dont confirm bankingTed when not found', async () => {
        const transactionId = faker.datatype.uuid();
        const bankingTed = await BankingTedFactory.create<BankingTedModel>(
          BankingTedModel.name,
          { state: BankingTedState.WAITING },
        );

        const message: ConfirmBankingTedRequest = {
          transactionId: transactionId,
          beneficiaryDocument: bankingTed.beneficiaryDocument,
          beneficiaryBankCode: bankingTed.beneficiaryBankCode,
          beneficiaryAgency: bankingTed.beneficiaryAgency,
          beneficiaryAccount: bankingTed.beneficiaryAccount,
          beneficiaryAccountType: bankingTed.beneficiaryAccountType,
          amount: bankingTed.amount,
        };

        const testScript = () =>
          controller.execute(
            bankingTedRepository,
            adminBankingAccountRepository,
            adminBankingTedRepository,
            bankingTedEmitter,
            adminBankingTedEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(BankingTedNotFoundException);
        expect(mockEmitBankingTedStaticEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('ConfirmAdminBankingTed', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should confirm successfully', async () => {
        const adminAccountBankingTed =
          await AdminBankingAccountFactory.create<AdminBankingAccountModel>(
            AdminBankingAccountModel.name,
          );

        const adminBankingTed =
          await AdminBankingTedFactory.create<AdminBankingTedModel>(
            AdminBankingTedModel.name,
            {
              state: AdminBankingTedState.WAITING,
              destinationId: adminAccountBankingTed.id,
            },
          );

        const message: ConfirmBankingTedRequest = {
          transactionId: adminBankingTed.transactionId,
          beneficiaryDocument: adminAccountBankingTed.document,
          beneficiaryAccount:
            adminAccountBankingTed.accountNumber +
            adminAccountBankingTed.accountDigit,
          beneficiaryAccountType: AccountType.CC,
          beneficiaryAgency: adminAccountBankingTed.branchNumber,
          beneficiaryBankCode: adminAccountBankingTed.bankCode,
          amount: adminBankingTed.value,
        };

        const result = await controller.execute(
          bankingTedRepository,
          adminBankingAccountRepository,
          adminBankingTedRepository,
          bankingTedEmitter,
          adminBankingTedEmitter,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
        expect(mockEmitAdminBankingTedStaticEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitAdminBankingTedStaticEvent.mock.calls[0][0]).toBe(
          AdminBankingTedState.CONFIRMED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should throw AdminBankingTedNotFoundException when admin banking ted not found', async () => {
        const adminAccountBankingTed =
          await AdminBankingAccountFactory.create<AdminBankingAccountModel>(
            AdminBankingAccountModel.name,
          );

        const adminBankingTed =
          await AdminBankingTedFactory.create<AdminBankingTedModel>(
            AdminBankingTedModel.name,
            {
              state: AdminBankingTedState.WAITING,
              destinationId: adminAccountBankingTed.id,
            },
          );

        const message: ConfirmBankingTedRequest = {
          transactionId: faker.datatype.uuid(),
          beneficiaryDocument: adminAccountBankingTed.document,
          beneficiaryAccount:
            adminAccountBankingTed.accountNumber +
            adminAccountBankingTed.accountDigit,
          beneficiaryAccountType: AccountType.CC,
          beneficiaryAgency: adminAccountBankingTed.branchNumber,
          beneficiaryBankCode: adminAccountBankingTed.bankCode,
          amount: adminBankingTed.value,
        };

        const result = controller.execute(
          bankingTedRepository,
          adminBankingAccountRepository,
          adminBankingTedRepository,
          bankingTedEmitter,
          adminBankingTedEmitter,
          logger,
          message,
          ctx,
        );

        await expect(result).rejects.toThrow(BankingTedNotFoundException);
        expect(mockEmitAdminBankingTedStaticEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
