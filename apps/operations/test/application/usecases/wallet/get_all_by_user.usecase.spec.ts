import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { WalletEntity, WalletRepository } from '@zro/operations/domain';
import { GetAllWalletByUserUseCase as UseCase } from '@zro/operations/application';
import { UserFactory } from '@zro/test/users/config';
import { WalletFactory } from '@zro/test/operations/config';

describe('GetAllWalletByUserUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const walletRepository: WalletRepository = createMock<WalletRepository>();
    const mockGetAllWalletByUser: jest.Mock = On(walletRepository).get(
      method((mock) => mock.getAllByUser),
    );

    const sut = new UseCase(logger, walletRepository);

    return { sut, mockGetAllWalletByUser };
  };

  it('TC0001 - Should get wallets by user successfully', async () => {
    const { sut, mockGetAllWalletByUser } = makeSut();

    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const wallets = await WalletFactory.createMany<WalletEntity>(
      WalletEntity.name,
      3,
      { user },
    );

    mockGetAllWalletByUser.mockResolvedValue(wallets);

    const result = await sut.execute(user);

    expect(result).toBeDefined();
    result.forEach((res) => {
      expect(res.id).toBeDefined();
      expect(res.uuid).toBeDefined();
      expect(res.name).toBeDefined();
      expect(res.default).toBeDefined();
      expect(res.state).toBeDefined();
      expect(res.user.uuid).toBe(user.uuid);
    });
  });

  it('TC0002 - Should not get wallets by user if missing user', async () => {
    const { sut } = makeSut();

    const tests = [
      () => sut.execute(null),
      () => sut.execute(new UserEntity({})),
    ];

    for (const test of tests) {
      await expect(test).rejects.toThrow(MissingDataException);
    }
  });
});
