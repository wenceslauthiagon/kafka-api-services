import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { UserEntity, UserRepository } from '@zro/users/domain';
import { ChangeUserPasswordUseCase as UseCase } from '@zro/users/application';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { UserFactory } from '@zro/test/users/config';
import { faker } from '@faker-js/faker/locale/pt_BR';

describe('ChangeUserPasswordUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const userRepository: UserRepository = createMock<UserRepository>();
    const mockGetByUuidRepository: jest.Mock = On(userRepository).get(
      method((mock) => mock.getByUuid),
    );
    const mockUpdateRepository: jest.Mock = On(userRepository).get(
      method((mock) => mock.update),
    );

    return {
      userRepository,
      mockGetByUuidRepository,
      mockUpdateRepository,
    };
  };

  const makeSut = () => {
    const { userRepository, mockGetByUuidRepository, mockUpdateRepository } =
      mockRepository();

    const sut = new UseCase(logger, userRepository);

    return {
      sut,
      mockGetByUuidRepository,
      mockUpdateRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not change if missing params', async () => {
      const { sut, mockGetByUuidRepository, mockUpdateRepository } = makeSut();

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(new UserEntity({}), null),
        () => sut.execute(null, 'new_password'),
        () => sut.execute(new UserEntity({}), 'new_password'),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should change successfully', async () => {
      const { sut, mockGetByUuidRepository, mockUpdateRepository } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const password = faker.datatype.string(10);

      mockGetByUuidRepository.mockResolvedValue(user);

      const result = await sut.execute(user, password);

      expect(result).toBeDefined();
      expect(result.uuid).toBe(user.uuid);
      expect(result.password).toBe(password);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByUuidRepository).toHaveBeenCalledWith(user.uuid);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
    });
  });
});
