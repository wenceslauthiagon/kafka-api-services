import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';
import {
  HandleUserWithdrawSettingRequestFailedUseCase as UseCase,
  UserWithdrawSettingRequestEventEmitter,
  UserWithdrawSettingRequestNotFoundException,
} from '@zro/compliance/application';
import { UserWithdrawSettingRequestFactory } from '@zro/test/compliance/config';

describe('HandleUserWithdrawSettingRequestFailedUseCase', () => {
  const mockEmitter = () => {
    const eventEmitter: UserWithdrawSettingRequestEventEmitter =
      createMock<UserWithdrawSettingRequestEventEmitter>();

    const mockFailedUserWithdrawSettingRequestEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.failed));

    return {
      eventEmitter,
      mockFailedUserWithdrawSettingRequestEvent,
    };
  };

  const mockRepository = () => {
    const userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository =
      createMock<UserWithdrawSettingRequestRepository>();

    const mockGetUserWithdrawSettingRequestRepository: jest.Mock = On(
      userWithdrawSettingRequestRepository,
    ).get(method((mock) => mock.getById));

    const mockUpdateUserWithdrawSettingRequestRepository: jest.Mock = On(
      userWithdrawSettingRequestRepository,
    ).get(method((mock) => mock.update));

    return {
      userWithdrawSettingRequestRepository,
      mockUpdateUserWithdrawSettingRequestRepository,
      mockGetUserWithdrawSettingRequestRepository,
    };
  };

  const makeSut = () => {
    const {
      userWithdrawSettingRequestRepository,
      mockGetUserWithdrawSettingRequestRepository,
      mockUpdateUserWithdrawSettingRequestRepository,
    } = mockRepository();

    const { eventEmitter, mockFailedUserWithdrawSettingRequestEvent } =
      mockEmitter();

    const sut = new UseCase(
      logger,
      userWithdrawSettingRequestRepository,
      eventEmitter,
    );

    return {
      sut,
      mockGetUserWithdrawSettingRequestRepository,
      mockUpdateUserWithdrawSettingRequestRepository,
      mockFailedUserWithdrawSettingRequestEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle if missing params', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockUpdateUserWithdrawSettingRequestRepository,
        mockFailedUserWithdrawSettingRequestEvent,
      } = makeSut();

      const tests = [
        () => sut.execute(null),
        () => sut.execute(new UserWithdrawSettingRequestEntity({})),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(
        mockUpdateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockFailedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
    });

    it('TC0002 - Should not handle if user withdraw setting request not found', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockUpdateUserWithdrawSettingRequestRepository,
        mockFailedUserWithdrawSettingRequestEvent,
      } = makeSut();

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(null);

      const test = () => sut.execute(userWithdrawSettingRequest);

      await expect(test).rejects.toThrow(
        UserWithdrawSettingRequestNotFoundException,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockUpdateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockFailedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
    });

    it('TC0003 - Should not handle if is already failed', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockUpdateUserWithdrawSettingRequestRepository,
        mockFailedUserWithdrawSettingRequestEvent,
      } = makeSut();

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          { state: UserWithdrawSettingRequestState.FAILED },
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );

      await sut.execute(userWithdrawSettingRequest);

      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockUpdateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockFailedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        0,
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should handle successfully', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockUpdateUserWithdrawSettingRequestRepository,
        mockFailedUserWithdrawSettingRequestEvent,
      } = makeSut();

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          { state: UserWithdrawSettingRequestState.PENDING },
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );
      mockUpdateUserWithdrawSettingRequestRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );

      await sut.execute(userWithdrawSettingRequest);

      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockUpdateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockFailedUserWithdrawSettingRequestEvent).toHaveBeenCalledTimes(
        1,
      );
    });
  });
});
