import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  UserOnboardingRepository,
  UserPinAttemptsRepository,
  UserRepository,
  UserSettingRepository,
  UserState,
} from '@zro/users/domain';
import { PendingUserNestObserver as Observer } from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { HandlePendingUserEventRequest } from '@zro/users/interface';

describe('CreateUserMicroserviceController', () => {
  let module: TestingModule;
  let observer: Observer;

  const userRepository: UserRepository = createMock<UserRepository>();
  const userPinAttemptsRepository: UserPinAttemptsRepository =
    createMock<UserPinAttemptsRepository>();
  const userOnboardingRepository: UserOnboardingRepository =
    createMock<UserOnboardingRepository>();
  const userSettingRepository: UserSettingRepository =
    createMock<UserSettingRepository>();
  const mockGetByUuidRepository: jest.Mock = On(userRepository).get(
    method((mock) => mock.getByUuid),
  );
  const mockCreateUserPinAttemptsRepository: jest.Mock = On(
    userPinAttemptsRepository,
  ).get(method((mock) => mock.create));
  const mockCreateUserOnboardingRepository: jest.Mock = On(
    userOnboardingRepository,
  ).get(method((mock) => mock.create));
  const mockCreateUserSettingRepository: jest.Mock = On(
    userSettingRepository,
  ).get(method((mock) => mock.create));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    observer = module.get<Observer>(Observer);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandlePendingUserEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create successfully', async () => {
        const user = {
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: faker.datatype.uuid(),
          name: faker.name.firstName(),
          phoneNumber:
            '551198' +
            faker.datatype.number(9999999).toString().padStart(7, '0'),
          state: UserState.PENDING,
        };

        const message: HandlePendingUserEventRequest = {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          state: user.state,
          uuid: user.uuid,
        };

        mockGetByUuidRepository.mockResolvedValue(user);

        await observer.execute(
          message,

          userRepository,
          userPinAttemptsRepository,
          userOnboardingRepository,
          userSettingRepository,
          logger,
        );

        expect(mockGetByUuidRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateUserPinAttemptsRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateUserOnboardingRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateUserSettingRepository).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle if uuid is not uuid', async () => {
        const user = {
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: faker.datatype.number({ min: 1, max: 99999 }).toString(),
          name: faker.name.firstName(),
          phoneNumber:
            '551198' +
            faker.datatype.number(9999999).toString().padStart(7, '0'),
          state: UserState.PENDING,
        };

        const message: HandlePendingUserEventRequest = {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          state: user.state,
          uuid: user.uuid,
        };

        mockGetByUuidRepository.mockResolvedValue(user);

        const test = () =>
          observer.execute(
            message,
            userRepository,
            userPinAttemptsRepository,
            userOnboardingRepository,
            userSettingRepository,
            logger,
          );
        await expect(test).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0003 - Should not handle if name is empty', async () => {
        const user = {
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: faker.datatype.uuid(),
          name: '',
          phoneNumber:
            '551198' +
            faker.datatype.number(9999999).toString().padStart(7, '0'),
          state: UserState.PENDING,
        };

        const message: HandlePendingUserEventRequest = {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          state: user.state,
          uuid: user.uuid,
        };

        mockGetByUuidRepository.mockResolvedValue(user);

        const test = () =>
          observer.execute(
            message,
            userRepository,
            userPinAttemptsRepository,
            userOnboardingRepository,
            userSettingRepository,
            logger,
          );
        await expect(test).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0004 - Should not handle if name greater than 255 characters', async () => {
        const user = {
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: faker.datatype.uuid(),
          name: faker.lorem.words(127),
          phoneNumber:
            '551198' +
            faker.datatype.number(9999999).toString().padStart(7, '0'),
          state: UserState.PENDING,
        };

        const message: HandlePendingUserEventRequest = {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          state: user.state,
          uuid: user.uuid,
        };

        mockGetByUuidRepository.mockResolvedValue(user);

        const test = () =>
          observer.execute(
            message,
            userRepository,
            userPinAttemptsRepository,
            userOnboardingRepository,
            userSettingRepository,
            logger,
          );
        await expect(test).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0005 - Should not handle if phoneNumber is greater than 25 characters', async () => {
        const user = {
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: faker.datatype.uuid(),
          name: faker.name.firstName(),
          phoneNumber: faker.datatype
            .number({ min: 1, max: 9999 })
            .toString()
            .padStart(26, '0'),
          state: UserState.PENDING,
        };

        const message: HandlePendingUserEventRequest = {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          state: user.state,
          uuid: user.uuid,
        };

        mockGetByUuidRepository.mockResolvedValue(user);

        const test = () =>
          observer.execute(
            message,
            userRepository,
            userPinAttemptsRepository,
            userOnboardingRepository,
            userSettingRepository,
            logger,
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
