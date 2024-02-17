import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { UserLimitEntity } from '@zro/operations/domain';
import {
  UserLimitRequestAnalysisResultType,
  UserLimitRequestEntity,
  UserLimitRequestRepository,
} from '@zro/compliance/domain';
import { UserEntity } from '@zro/users/domain';
import {
  CloseUserLimitRequestUseCase as UseCase,
  UserLimitRequestEventEmitter,
  UserLimitRequestNotFoundException,
} from '@zro/compliance/application';
import { UserLimitRequestFactory } from '@zro/test/compliance/config';

describe('CloseUserLimitRequestUseCase', () => {
  const makeSut = () => {
    const {
      userLimitRequestRepository,
      mockGetByIdUserLimitRequestRepository,
      mockUpdateUserLimitRequestRepository,
    } = mockRepository();

    const {
      eventEmitter,
      mockApprovedUserLimitRequestEvent,
      mockRejectedUserLimitRequestEvent,
    } = mockEmitter();

    const sut = new UseCase(logger, userLimitRequestRepository, eventEmitter);

    return {
      sut,
      mockGetByIdUserLimitRequestRepository,
      mockUpdateUserLimitRequestRepository,
      mockApprovedUserLimitRequestEvent,
      mockRejectedUserLimitRequestEvent,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: UserLimitRequestEventEmitter =
      createMock<UserLimitRequestEventEmitter>();

    const mockApprovedUserLimitRequestEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.closedConfirmedApproved),
    );

    const mockRejectedUserLimitRequestEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.closedConfirmedRejected),
    );

    return {
      eventEmitter,
      mockApprovedUserLimitRequestEvent,
      mockRejectedUserLimitRequestEvent,
    };
  };

  const mockRepository = () => {
    const userLimitRequestRepository: UserLimitRequestRepository =
      createMock<UserLimitRequestRepository>();

    const mockGetByIdUserLimitRequestRepository: jest.Mock = On(
      userLimitRequestRepository,
    ).get(method((mock) => mock.getById));

    const mockUpdateUserLimitRequestRepository: jest.Mock = On(
      userLimitRequestRepository,
    ).get(method((mock) => mock.update));

    return {
      userLimitRequestRepository,
      mockGetByIdUserLimitRequestRepository,
      mockUpdateUserLimitRequestRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw if user limit request not has id', async () => {
      const {
        sut,
        mockGetByIdUserLimitRequestRepository,
        mockUpdateUserLimitRequestRepository,
        mockApprovedUserLimitRequestEvent,
        mockRejectedUserLimitRequestEvent,
      } = makeSut();

      const test = [
        () =>
          sut.execute(
            new UserLimitRequestEntity({ user: null, userLimit: null }),
          ),
        () =>
          sut.execute(
            new UserLimitRequestEntity({
              user: new UserEntity({}),
              userLimit: null,
            }),
          ),
        () =>
          sut.execute(
            new UserLimitRequestEntity({
              user: null,
              userLimit: new UserLimitEntity({}),
            }),
          ),
        () =>
          sut.execute(
            new UserLimitRequestEntity({
              user: new UserEntity({}),
              userLimit: new UserLimitEntity({}),
            }),
          ),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByIdUserLimitRequestRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateUserLimitRequestRepository).toHaveBeenCalledTimes(0);
      expect(mockApprovedUserLimitRequestEvent).toHaveBeenCalledTimes(0);
      expect(mockRejectedUserLimitRequestEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw UserLimitRequestNotFound if user limit request not exists', async () => {
      const {
        sut,
        mockGetByIdUserLimitRequestRepository,
        mockUpdateUserLimitRequestRepository,
        mockApprovedUserLimitRequestEvent,
        mockRejectedUserLimitRequestEvent,
      } = makeSut();

      const userLimitRequest =
        await UserLimitRequestFactory.create<UserLimitRequestEntity>(
          UserLimitRequestEntity.name,
          { analysisResult: UserLimitRequestAnalysisResultType.APPROVED },
        );

      mockGetByIdUserLimitRequestRepository.mockImplementationOnce(null);

      const test = () => sut.execute(userLimitRequest);

      await expect(test).rejects.toThrow(UserLimitRequestNotFoundException);

      expect(mockGetByIdUserLimitRequestRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateUserLimitRequestRepository).toHaveBeenCalledTimes(0);
      expect(mockApprovedUserLimitRequestEvent).toHaveBeenCalledTimes(0);
      expect(mockRejectedUserLimitRequestEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should call approved event', async () => {
      const {
        sut,
        mockGetByIdUserLimitRequestRepository,
        mockUpdateUserLimitRequestRepository,
        mockApprovedUserLimitRequestEvent,
        mockRejectedUserLimitRequestEvent,
      } = makeSut();

      const userLimitRequest =
        await UserLimitRequestFactory.create<UserLimitRequestEntity>(
          UserLimitRequestEntity.name,
          { analysisResult: UserLimitRequestAnalysisResultType.APPROVED },
        );

      mockGetByIdUserLimitRequestRepository.mockResolvedValue(userLimitRequest);

      await sut.execute(userLimitRequest);

      expect(mockGetByIdUserLimitRequestRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateUserLimitRequestRepository).toHaveBeenCalledTimes(1);
      expect(mockApprovedUserLimitRequestEvent).toHaveBeenCalledTimes(1);
      expect(mockRejectedUserLimitRequestEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should call rejected event', async () => {
      const {
        sut,
        mockGetByIdUserLimitRequestRepository,
        mockUpdateUserLimitRequestRepository,
        mockApprovedUserLimitRequestEvent,
        mockRejectedUserLimitRequestEvent,
      } = makeSut();

      const userLimitRequest =
        await UserLimitRequestFactory.create<UserLimitRequestEntity>(
          UserLimitRequestEntity.name,
          { analysisResult: UserLimitRequestAnalysisResultType.REJECTED },
        );

      mockGetByIdUserLimitRequestRepository.mockResolvedValue(userLimitRequest);

      await sut.execute(userLimitRequest);

      expect(mockGetByIdUserLimitRequestRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateUserLimitRequestRepository).toHaveBeenCalledTimes(1);
      expect(mockApprovedUserLimitRequestEvent).toHaveBeenCalledTimes(0);
      expect(mockRejectedUserLimitRequestEvent).toHaveBeenCalledTimes(1);
    });
  });
});
