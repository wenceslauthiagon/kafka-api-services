import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { WalletEntity, WalletRepository } from '@zro/operations/domain';
import { GetWalletByUserAndDefaultIsTrueUseCase as UseCase } from '@zro/operations/application';
import { UserFactory } from '@zro/test/users/config';
import { WalletFactory } from '@zro/test/operations/config';

describe('GetWalletByUserAndDefaultIsTrueUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const walletRepository: WalletRepository = createMock<WalletRepository>();
    const mockGetWalletByUser: jest.Mock = On(walletRepository).get(
      method((mock) => mock.getByUserAndDefaultIsTrue),
    );

    const sut = new UseCase(logger, walletRepository);

    return { sut, mockGetWalletByUser };
  };

  it('TC0001 - Should get wallet default by user successfully', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const wallet = await WalletFactory.create<WalletEntity>(WalletEntity.name, {
      user,
      default: true,
    });

    const { sut, mockGetWalletByUser } = makeSut();

    mockGetWalletByUser.mockResolvedValue(wallet);

    const foundWallet = await sut.execute(user);

    expect(foundWallet).toBeDefined();
    expect(foundWallet.id).toBe(wallet.id);
    expect(foundWallet.state).toBe(wallet.state);
    expect(foundWallet.user.uuid).toBe(user.uuid);
    expect(mockGetWalletByUser).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should not get wallet default by user', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const { sut, mockGetWalletByUser } = makeSut();

    mockGetWalletByUser.mockResolvedValue(null);

    const foundOnboarding = await sut.execute(user);

    expect(foundOnboarding).toBeNull();
    expect(mockGetWalletByUser).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should throw MissingDataException when user id dont exist', async () => {
    const { sut, mockGetWalletByUser } = makeSut();

    await expect(() => sut.execute(null)).rejects.toThrow(MissingDataException);
    expect(mockGetWalletByUser).toHaveBeenCalledTimes(0);
  });
});
