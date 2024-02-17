import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { UserRepository, UserEntity } from '@zro/users/domain';
import { GetUserByDocumentUseCase as UseCase } from '@zro/users/application';
import { UserFactory } from '@zro/test/users/config';

describe('GetUserByCpfUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const userRepository: UserRepository = createMock<UserRepository>();
    const mockGetByCpfRepository: jest.Mock = On(userRepository).get(
      method((mock) => mock.getByDocument),
    );

    const sut = new UseCase(logger, userRepository);
    return { sut, mockGetByCpfRepository };
  };

  it('TC0001 - Should get user successfully', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const { sut, mockGetByCpfRepository } = makeSut();

    mockGetByCpfRepository.mockResolvedValue(user);

    const foundUser = await sut.execute(user.document);

    expect(foundUser).toBeDefined();
    expect(foundUser.document).toBe(user.document);
  });

  it('TC0002 - Should not get user with invalid cpf', async () => {
    const { sut, mockGetByCpfRepository } = makeSut();

    mockGetByCpfRepository.mockResolvedValue(null);

    const foundUser = await sut.execute('XXXXXX');

    expect(foundUser).toBeNull();
  });
});
