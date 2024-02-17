import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequestState,
} from '@zro/compliance/domain';
import { HandleUserWithdrawSettingRequestFailedByDocumentUseCase as UseCase } from '@zro/compliance/application';
import { UserWithdrawSettingRequestFactory } from '@zro/test/compliance/config';

describe('HandleUserWithdrawSettingRequestFailedByDocumentUseCase', () => {
  const mockRepository = () => {
    const userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository =
      createMock<UserWithdrawSettingRequestRepository>();

    const mockGetUserWithdrawSettingRequestRepository: jest.Mock = On(
      userWithdrawSettingRequestRepository,
    ).get(method((mock) => mock.getById));

    const mockCreateUserWithdrawSettingRequestRepository: jest.Mock = On(
      userWithdrawSettingRequestRepository,
    ).get(method((mock) => mock.create));

    return {
      userWithdrawSettingRequestRepository,
      mockGetUserWithdrawSettingRequestRepository,
      mockCreateUserWithdrawSettingRequestRepository,
    };
  };

  const makeSut = () => {
    const {
      userWithdrawSettingRequestRepository,
      mockGetUserWithdrawSettingRequestRepository,
      mockCreateUserWithdrawSettingRequestRepository,
    } = mockRepository();

    const sut = new UseCase(logger, userWithdrawSettingRequestRepository);

    return {
      sut,
      mockGetUserWithdrawSettingRequestRepository,
      mockCreateUserWithdrawSettingRequestRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle if missing params', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestRepository,
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
        mockCreateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not handle if is already FailedByDocument', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestRepository,
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
        mockCreateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should handle successfully', async () => {
      const {
        sut,
        mockGetUserWithdrawSettingRequestRepository,
        mockCreateUserWithdrawSettingRequestRepository,
      } = makeSut();

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
          { state: UserWithdrawSettingRequestState.FAILED },
        );

      mockGetUserWithdrawSettingRequestRepository.mockResolvedValue(null);

      await sut.execute(userWithdrawSettingRequest);

      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWithdrawSettingRequestRepository).toHaveBeenCalledWith(
        userWithdrawSettingRequest.id,
      );
      expect(
        mockCreateUserWithdrawSettingRequestRepository,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
