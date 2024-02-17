import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import { CreateUserMicroserviceController as Controller } from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import {
  CreateUserRequest,
  UserEventEmitterControllerInterface,
  UserEventType,
} from '@zro/users/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('CreateUserMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;

  const userRepository: UserRepository = createMock<UserRepository>();
  const mockCreateUserRepository: jest.Mock = On(userRepository).get(
    method((mock) => mock.create),
  );
  const mockGetByPhoneNumberRepository: jest.Mock = On(userRepository).get(
    method((mock) => mock.getByPhoneNumber),
  );
  const mockGetByReferralCodeRepository: jest.Mock = On(userRepository).get(
    method((mock) => mock.getByReferralCode),
  );
  const eventEmitterController: UserEventEmitterControllerInterface =
    createMock<UserEventEmitterControllerInterface>();
  const mockCreatedUserEventController: jest.Mock = On(
    eventEmitterController,
  ).get(method((mock) => mock.emitUserEvent));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateUser', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create successfully', async () => {
        const user = {
          id: faker.datatype.uuid(),
          name: faker.name.firstName(),
          phoneNumber:
            '+551198' +
            faker.datatype.number(9999999).toString().padStart(7, '0'),
          referralCode: faker.datatype.number(99999).toString(),
          password:
            '$2a$32$56dUfdhB1XvYg0B1KgUU/uWCUsJ3nrC7N0W0.RmCYIMcDbIzafV/.',
          confirmCode: faker.datatype.number(99999).toString().padStart(5, '0'),
          email: faker.internet.email(),
        };

        const message: CreateUserRequest = {
          confirmCode: user.confirmCode,
          email: user.email,
          id: user.id,
          name: user.name,
          password: user.password,
          phoneNumber: user.phoneNumber,
          referralCode: user.referralCode,
        };

        mockGetByPhoneNumberRepository.mockResolvedValue(null);
        mockGetByReferralCodeRepository.mockReturnValueOnce(null);
        mockCreateUserRepository.mockImplementationOnce((user) => ({
          ...user,
          id: faker.datatype.number({ min: 1, max: 999999 }),
        }));

        const result = await controller.execute(
          userRepository,
          logger,
          eventEmitterController,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(mockCreateUserRepository).toHaveBeenCalledTimes(1);
        expect(mockGetByPhoneNumberRepository).toHaveBeenCalledTimes(1);
        expect(mockGetByReferralCodeRepository).toHaveBeenCalledTimes(1);
        expect(mockCreatedUserEventController).toHaveBeenCalledTimes(1);
        expect(mockCreatedUserEventController.mock.calls[0][0]).toBe(
          UserEventType.PENDING,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not create if name is not string', async () => {
        const user = {
          id: faker.datatype.uuid(),
          name: faker.datatype.number(99999) as unknown as string,
          phoneNumber:
            '551198' +
            faker.datatype.number(9999999).toString().padStart(7, '0'),
          referralCode: faker.datatype.number(99999).toString(),
          password:
            '$2a$32$56dUfdhB1XvYg0B1KgUU/uWCUsJ3nrC7N0W0.RmCYIMcDbIzafV/.',
          confirmCode: faker.datatype.number(99999).toString().padStart(5, '0'),
          email: faker.internet.email(),
        };

        const message: CreateUserRequest = {
          confirmCode: user.confirmCode,
          email: user.email,
          id: user.id,
          name: user.name,
          password: user.password,
          phoneNumber: user.phoneNumber,
          referralCode: user.referralCode,
        };

        mockGetByPhoneNumberRepository.mockResolvedValue(null);
        mockGetByReferralCodeRepository.mockReturnValueOnce(null);
        mockCreateUserRepository.mockImplementationOnce((user) => user);

        const test = () =>
          controller.execute(
            userRepository,
            logger,
            eventEmitterController,
            message,
            ctx,
          );

        await expect(test).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0003 - Should not create if phoneNumber is empty', async () => {
        const user = {
          id: faker.datatype.uuid(),
          name: faker.name.firstName(),
          phoneNumber: '',
          referralCode: faker.datatype.number(99999).toString(),
          password:
            '$2a$32$56dUfdhB1XvYg0B1KgUU/uWCUsJ3nrC7N0W0.RmCYIMcDbIzafV/.',
          confirmCode: faker.datatype.number(99999).toString().padStart(5, '0'),
          email: faker.internet.email(),
        };

        const message: CreateUserRequest = {
          confirmCode: user.confirmCode,
          email: user.email,
          id: user.id,
          name: user.name,
          password: user.password,
          phoneNumber: user.phoneNumber,
          referralCode: user.referralCode,
        };

        mockGetByPhoneNumberRepository.mockResolvedValue(null);
        mockGetByReferralCodeRepository.mockReturnValueOnce(null);
        mockCreateUserRepository.mockImplementationOnce((user) => user);

        const test = () =>
          controller.execute(
            userRepository,
            logger,
            eventEmitterController,
            message,
            ctx,
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
