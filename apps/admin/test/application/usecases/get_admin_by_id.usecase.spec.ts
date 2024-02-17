import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { AdminEntity, AdminRepository } from '@zro/admin/domain';
import { GetAdminByIdUseCase as UseCase } from '@zro/admin/application';
import { AdminFactory } from '@zro/test/admin/config';

describe('GetAdminByIdUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { adminRepository, mockGetAdminRepository } = mockRepository();

    const sut = new UseCase(logger, adminRepository);

    return {
      sut,
      mockGetAdminRepository,
    };
  };

  const mockRepository = () => {
    const adminRepository: AdminRepository = createMock<AdminRepository>();
    const mockGetAdminRepository: jest.Mock = On(adminRepository).get(
      method((mock) => mock.getById),
    );

    return {
      adminRepository,
      mockGetAdminRepository,
    };
  };

  it('TC0001 - Should get admin successfully', async () => {
    const { sut, mockGetAdminRepository } = makeSut();

    const admin = await AdminFactory.create<AdminEntity>(AdminEntity.name);
    mockGetAdminRepository.mockResolvedValue(admin);

    const foundAdmin = await sut.execute(admin.id);

    expect(foundAdmin).toBeDefined();
    expect(foundAdmin).toMatchObject(admin);
    expect(mockGetAdminRepository).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should not get admin with invalid id', async () => {
    const { sut, mockGetAdminRepository } = makeSut();

    const testScript = () => sut.execute(null);

    await expect(testScript).rejects.toThrow(MissingDataException);
    expect(mockGetAdminRepository).toHaveBeenCalledTimes(0);
  });
});
