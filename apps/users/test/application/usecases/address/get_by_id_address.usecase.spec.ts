import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  AddressEntity,
  AddressRepository,
  UserEntity,
} from '@zro/users/domain';
import {
  GetAddressByIdUseCase as UseCase,
  AddressNotFoundException,
} from '@zro/users/application';
import { AddressFactory, UserFactory } from '@zro/test/users/config';

describe('GetAddressByIdUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const addressRepository: AddressRepository =
      createMock<AddressRepository>();
    const mockGetById: jest.Mock = On(addressRepository).get(
      method((mock) => mock.getById),
    );

    const sut = new UseCase(logger, addressRepository);
    return { sut, mockGetById };
  };

  it('TC0001 - Should get address successfully', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const address = await AddressFactory.create<AddressEntity>(
      AddressEntity.name,
      { user },
    );

    const { sut, mockGetById } = makeSut();

    mockGetById.mockResolvedValue(address);

    const foundAddress = await sut.execute(address.id, user);

    expect(foundAddress).toBeDefined();
    expect(foundAddress.id).toBe(address.id);
    expect(foundAddress.user.uuid).toBe(user.uuid);
  });

  it('TC0002 - Should not get address with incorrect id', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const { sut, mockGetById } = makeSut();

    mockGetById.mockResolvedValue(null);

    const testScript = () => sut.execute(9999, user);

    await expect(testScript).rejects.toThrow(AddressNotFoundException);
  });

  it('TC0003 - Should not get address if another user has this address id', async () => {
    const address = await AddressFactory.create<AddressEntity>(
      AddressEntity.name,
    );
    const user = new UserEntity({ uuid: uuidV4() });

    const { sut, mockGetById } = makeSut();

    mockGetById.mockResolvedValue(address);

    const foundAddress = await sut.execute(address.id, user);

    expect(foundAddress).toBeDefined();
    expect(foundAddress.id).toBe(address.id);
    expect(foundAddress.user).toMatchObject(address.user);
  });
});
