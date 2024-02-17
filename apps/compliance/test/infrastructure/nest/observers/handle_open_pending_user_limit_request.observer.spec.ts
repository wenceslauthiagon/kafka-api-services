import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  UserLimitRequestEntity,
  UserLimitRequestRepository,
  UserLimitRequestState,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';
import {
  UserLimitRequestGateway,
  UserService,
} from '@zro/compliance/application';
import { HandleOpenPendingUserLimitRequestNestObserver as Observer } from '@zro/compliance/infrastructure';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import {
  HandleOpenPendingUserLimitRequest,
  UserLimitRequestControllerEvent,
  UserLimitRequestEventEmitterControllerInterface,
  UserLimitRequestEventType,
} from '@zro/compliance/interface';
import { UserLimitRequestFactory } from '@zro/test/compliance/config';

describe('HandleOpenPendingUserLimitRequestObserver', () => {
  let module: TestingModule;
  let observer: Observer;

  const userLimitRequestRepository: UserLimitRequestRepository =
    createMock<UserLimitRequestRepository>();

  const mockGetUserLimitRequestRepository: jest.Mock = On(
    userLimitRequestRepository,
  ).get(method((mock) => mock.getById));

  const mockUpdateUserLimitRequestRepository: jest.Mock = On(
    userLimitRequestRepository,
  ).get(method((mock) => mock.update));

  const eventEmitterController: UserLimitRequestEventEmitterControllerInterface =
    createMock<UserLimitRequestEventEmitterControllerInterface>();

  const mockUserLimitRequestEventController: jest.Mock = On(
    eventEmitterController,
  ).get(method((mock) => mock.emitUserLimitRequestEvent));

  const userLimitRequestGateway: UserLimitRequestGateway =
    createMock<UserLimitRequestGateway>();

  const mockCreateUserLimitRequestGateway: jest.Mock = On(
    userLimitRequestGateway,
  ).get(method((mock) => mock.createUserLimitRequest));

  const userService: UserService = createMock<UserService>();

  const mockGetByUuidService: jest.Mock = On(userService).get(
    method((mock) => mock.getByUuid),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    observer = module.get<Observer>(Observer);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleOpenPendingUserLimitRequestEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create successfully', async () => {
        const fakeUserLimit =
          await UserLimitRequestFactory.create<UserLimitRequestEntity>(
            UserLimitRequestEntity.name,
            {
              status: UserLimitRequestStatus.OPEN,
              state: UserLimitRequestState.OPEN_PENDING,
            },
          );

        const userLimit = new UserLimitRequestControllerEvent({
          id: fakeUserLimit.id,
          status: fakeUserLimit.status,
          state: fakeUserLimit.state,
        });

        const message: HandleOpenPendingUserLimitRequest = {
          id: userLimit.id,
          status: userLimit.status,
          state: userLimit.state,
        };

        mockGetUserLimitRequestRepository.mockResolvedValue(fakeUserLimit);
        mockGetByUuidService.mockResolvedValue(fakeUserLimit.user);

        await observer.execute(
          message,
          userLimitRequestGateway,
          userLimitRequestRepository,
          eventEmitterController,
          userService,
          logger,
        );

        expect(mockGetUserLimitRequestRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateUserLimitRequestGateway).toHaveBeenCalledTimes(1);
        expect(mockUpdateUserLimitRequestRepository).toHaveBeenCalledTimes(1);
        expect(mockUserLimitRequestEventController).toHaveBeenCalledTimes(1);
        expect(mockUserLimitRequestEventController.mock.calls[0][0]).toBe(
          UserLimitRequestEventType.OPEN_CONFIRMED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
