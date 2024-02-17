import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { UserEntity, UserState } from '@zro/users/domain';
import {
  CurrencyDatabaseRepository,
  PendingUserNestObserver as Observer,
  UserServiceKafka,
  UserWalletDatabaseRepository,
  WalletAccountDatabaseRepository,
  WalletDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { HandlePendingUserEventRequest } from '@zro/operations/interface';

describe('PendingUserNestObserver', () => {
  let module: TestingModule;
  let observer: Observer;
  const currencyRepository = new CurrencyDatabaseRepository();
  const walletAccountRepository = new WalletAccountDatabaseRepository();
  const walletRepository = new WalletDatabaseRepository();
  const userWalletRepository = new UserWalletDatabaseRepository();
  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    observer = module.get<Observer>(Observer);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('Create Wallet Account', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create wallet account successfully', async () => {
        const userUuid = faker.datatype.uuid();
        const userPhoneNumber =
          '551198' + faker.datatype.number(9999999).toString().padStart(7, '0');
        const message: HandlePendingUserEventRequest = {
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: userUuid,
          name: faker.name.firstName() + ' ' + faker.name.lastName(),
          state: UserState.PENDING,
          phoneNumber:
            '551198' +
            faker.datatype.number(9999999).toString().padStart(7, '0'),
        };

        mockGetUserService.mockResolvedValue(
          new UserEntity({ uuid: userUuid, phoneNumber: userPhoneNumber }),
        );

        await observer.execute(
          walletAccountRepository,
          currencyRepository,
          walletRepository,
          userWalletRepository,
          logger,
          message,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - should not create a wallet account if id is not positive', async () => {
        const message: HandlePendingUserEventRequest = {
          id: -faker.datatype.number({ min: 1, max: 99999 }),
          uuid: faker.datatype.uuid(),
          name: faker.name.firstName() + ' ' + faker.name.lastName(),
          state: UserState.PENDING,
          phoneNumber:
            '551198' +
            faker.datatype.number(9999999).toString().padStart(7, '0'),
        };

        const test = () =>
          observer.execute(
            walletAccountRepository,
            currencyRepository,
            walletRepository,
            userWalletRepository,
            logger,
            message,
          );

        await expect(test).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0003 - should not create a wallet account if uuid is not uuid', async () => {
        const message: HandlePendingUserEventRequest = {
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: faker.datatype.number().toString(),
          name: faker.name.firstName() + ' ' + faker.name.lastName(),
          state: UserState.PENDING,
          phoneNumber:
            '551198' +
            faker.datatype.number(9999999).toString().padStart(7, '0'),
        };

        const test = () =>
          observer.execute(
            walletAccountRepository,
            currencyRepository,
            walletRepository,
            userWalletRepository,
            logger,
            message,
          );

        await expect(test).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
