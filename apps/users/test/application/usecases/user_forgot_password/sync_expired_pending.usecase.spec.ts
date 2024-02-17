import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger } from '@zro/common';
import {
  UserForgotPasswordEntity,
  UserForgotPasswordRepository,
  UserForgotPasswordState,
} from '@zro/users/domain';
import { SyncPendingExpiredUserForgotPasswordInvitationUseCase as UseCase } from '@zro/users/application';
import { UserForgotPasswordFactory } from '@zro/test/users/config';

const TIMESTAMP = 10 * 60; // 10 minutes in seconds.
const LENGTH = 5;

describe('SyncPendingExpiredUserForgotPasswordInvitationUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const userForgotPasswordRepository: UserForgotPasswordRepository =
      createMock<UserForgotPasswordRepository>();
    const mockGetByCreatedAtLessThanAndStateInRepository: jest.Mock = On(
      userForgotPasswordRepository,
    ).get(method((mock) => mock.getByCreatedAtLessThanAndStateIn));
    const mockUpdateRepository: jest.Mock = On(
      userForgotPasswordRepository,
    ).get(method((mock) => mock.update));

    return {
      userForgotPasswordRepository,
      mockGetByCreatedAtLessThanAndStateInRepository,
      mockUpdateRepository,
    };
  };

  const makeSut = () => {
    const {
      userForgotPasswordRepository,
      mockGetByCreatedAtLessThanAndStateInRepository,
      mockUpdateRepository,
    } = mockRepository();

    const sut = new UseCase(logger, userForgotPasswordRepository, TIMESTAMP);

    return {
      sut,
      mockGetByCreatedAtLessThanAndStateInRepository,
      mockUpdateRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not sync expired pending is not has expired user forgot password', async () => {
      const {
        sut,
        mockGetByCreatedAtLessThanAndStateInRepository,
        mockUpdateRepository,
      } = makeSut();

      mockGetByCreatedAtLessThanAndStateInRepository.mockResolvedValueOnce([]);

      await sut.execute();

      expect(
        mockGetByCreatedAtLessThanAndStateInRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should sync expired pending successfully', async () => {
      const {
        sut,
        mockGetByCreatedAtLessThanAndStateInRepository,
        mockUpdateRepository,
      } = makeSut();

      const usersForgotPassword =
        await UserForgotPasswordFactory.createMany<UserForgotPasswordEntity>(
          UserForgotPasswordEntity.name,
          LENGTH,
          {
            state: UserForgotPasswordState.PENDING,
            createdAt: faker.date.past(),
          },
        );

      mockGetByCreatedAtLessThanAndStateInRepository.mockResolvedValueOnce(
        usersForgotPassword,
      );

      await sut.execute();

      expect(
        mockGetByCreatedAtLessThanAndStateInRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(LENGTH);
    });
  });
});
