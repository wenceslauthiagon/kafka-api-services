import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestRepository,
} from '@zro/compliance/domain';
import { GetUserWithdrawSettingRequestByUserAndIdUseCase as UseCase } from '@zro/compliance/application';
import { UserWithdrawSettingRequestFactory } from '@zro/test/compliance/config';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { UserEntity } from '@zro/users/domain';

describe('GetUserWithdrawSettingRequestByUserAndIdUseCase', () => {
  const mockRepository = () => {
    const userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository =
      createMock<UserWithdrawSettingRequestRepository>();

    const mockGetUserWithdrawSettingRequestByUserAndIdRepository: jest.Mock =
      On(userWithdrawSettingRequestRepository).get(
        method((mock) => mock.getByUserAndId),
      );

    return {
      userWithdrawSettingRequestRepository,
      mockGetUserWithdrawSettingRequestByUserAndIdRepository,
    };
  };

  const makeSut = () => {
    const {
      userWithdrawSettingRequestRepository,
      mockGetUserWithdrawSettingRequestByUserAndIdRepository,
    } = mockRepository();

    const sut = new UseCase(logger, userWithdrawSettingRequestRepository);

    return {
      sut,
      mockGetUserWithdrawSettingRequestByUserAndIdRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get if missing params', async () => {
      const { sut, mockGetUserWithdrawSettingRequestByUserAndIdRepository } =
        makeSut();

      const test = [
        () => sut.execute(null, null),
        () => sut.execute(null, new UserEntity({})),
        () => sut.execute(faker.datatype.uuid(), new UserEntity({})),
        () => sut.execute(faker.datatype.uuid(), null),
        () =>
          sut.execute(null, new UserEntity({ uuid: faker.datatype.uuid() })),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(
        mockGetUserWithdrawSettingRequestByUserAndIdRepository,
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get successfully', async () => {
      const { sut, mockGetUserWithdrawSettingRequestByUserAndIdRepository } =
        makeSut();

      const userWithdrawSettingRequest =
        await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestEntity>(
          UserWithdrawSettingRequestEntity.name,
        );

      mockGetUserWithdrawSettingRequestByUserAndIdRepository.mockResolvedValue(
        userWithdrawSettingRequest,
      );

      const result = await sut.execute(
        userWithdrawSettingRequest.id,
        userWithdrawSettingRequest.user,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(userWithdrawSettingRequest.id);
      expect(result.state).toBe(userWithdrawSettingRequest.state);
      expect(result.analysisResult).toBe(
        userWithdrawSettingRequest.analysisResult,
      );
      expect(result.wallet).toBe(userWithdrawSettingRequest.wallet);
      expect(result.user).toBe(userWithdrawSettingRequest.user);
      expect(result.transactionType).toBe(
        userWithdrawSettingRequest.transactionType,
      );
      expect(result.pixKey).toBe(userWithdrawSettingRequest.pixKey);
      expect(result.type).toBe(userWithdrawSettingRequest.type);
      expect(result.day).toBe(userWithdrawSettingRequest.day);
      expect(result.weekDay).toBe(userWithdrawSettingRequest.weekDay);
      expect(result.createdAt).toBe(userWithdrawSettingRequest.createdAt);
      expect(result.updatedAt).toBe(userWithdrawSettingRequest.updatedAt);
      expect(result.closedAt).toBe(userWithdrawSettingRequest.closedAt);
      expect(
        mockGetUserWithdrawSettingRequestByUserAndIdRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetUserWithdrawSettingRequestByUserAndIdRepository,
      ).toHaveBeenCalledWith(
        userWithdrawSettingRequest.user,
        userWithdrawSettingRequest.id,
      );
    });
  });
});
