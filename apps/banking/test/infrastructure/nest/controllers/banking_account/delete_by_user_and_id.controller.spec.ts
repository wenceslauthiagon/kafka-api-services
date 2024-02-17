import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  BankingContactRepository,
  BankingAccountContactRepository,
} from '@zro/banking/domain';
import { DeleteBankingAccountContactRequest } from '@zro/banking/interface';
import {
  BankingContactModel,
  DeleteBankingAccountContactMicroserviceController as Controller,
  BankingContactDatabaseRepository,
  BankingAccountContactModel,
  BankingAccountContactDatabaseRepository,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import {
  BankingAccountContactFactory,
  BankingContactFactory,
} from '@zro/test/banking/config';

describe('DeleteBankingAccountContactMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankingContactRepository: BankingContactRepository;
  let bankingAccountContactRepository: BankingAccountContactRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    bankingContactRepository = new BankingContactDatabaseRepository();
    bankingAccountContactRepository =
      new BankingAccountContactDatabaseRepository();
  });

  describe('DeleteBankingAccountContact', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should delete bankingContact successfully if has only 1 bankingAccountContact', async () => {
        const bankingContact =
          await BankingContactFactory.create<BankingContactModel>(
            BankingContactModel.name,
          );
        const bankingAccountContact =
          await BankingAccountContactFactory.create<BankingAccountContactModel>(
            BankingAccountContactModel.name,
            {
              bankingContactId: bankingContact.id,
            },
          );

        const message: DeleteBankingAccountContactRequest = {
          id: bankingAccountContact.id,
          userId: bankingContact.id,
        };

        await controller.execute(
          bankingContactRepository,
          bankingAccountContactRepository,
          logger,
          message,
        );

        const bankingContactFound = await BankingContactModel.findOne({
          where: {
            id: bankingContact.id,
          },
        });

        const bankingAccountContactFound =
          await BankingAccountContactModel.findOne({
            where: {
              id: bankingAccountContact.id,
            },
          });

        expect(bankingContactFound).toBeNull();
        expect(bankingAccountContactFound).toBeNull();
      });

      it('TC0002 - Should delete only bankingAccountContact successfully if has more than 1 bankingAccountContact', async () => {
        const bankingContact =
          await BankingContactFactory.create<BankingContactModel>(
            BankingContactModel.name,
          );

        const bankingAccountContact =
          await BankingAccountContactFactory.create<BankingAccountContactModel>(
            BankingAccountContactModel.name,
            {
              bankingContactId: bankingContact.id,
            },
          );

        const otherBankingAccountContact =
          await BankingAccountContactFactory.create<BankingAccountContactModel>(
            BankingAccountContactModel.name,
            {
              bankingContactId: bankingContact.id,
            },
          );

        const message: DeleteBankingAccountContactRequest = {
          id: bankingAccountContact.id,
          userId: bankingContact.id,
        };

        await controller.execute(
          bankingContactRepository,
          bankingAccountContactRepository,
          logger,
          message,
        );

        const bankingContactFound = await BankingContactModel.findOne({
          where: {
            id: bankingContact.id,
          },
        });

        const otherBankingAccountContactFound =
          await BankingAccountContactModel.findOne({
            where: {
              id: otherBankingAccountContact.id,
            },
          });

        const bankingAccountContactFound =
          await BankingAccountContactModel.findOne({
            where: {
              id: bankingAccountContact.id,
            },
          });

        expect(bankingContactFound).toBeDefined();
        expect(bankingAccountContactFound).toBeNull();
        expect(otherBankingAccountContactFound).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
