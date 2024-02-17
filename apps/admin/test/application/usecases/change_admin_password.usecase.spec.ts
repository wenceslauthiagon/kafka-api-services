import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  defaultLogger as logger,
  getMoment,
} from '@zro/common';
import { AdminEntity, AdminRepository } from '@zro/admin/domain';
import {
  AdminNotFoundException,
  AdminPasswordInvalidException,
  AdminTokenExpirationTimeInvalidException,
  AdminVerificationCodeInvalidException,
  ChangeAdminPasswordUseCase,
  HashProvider,
} from '@zro/admin/application';
import { AdminFactory } from '@zro/test/admin/config';

describe('ChangeAdminPasswordUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      adminRepository,
      mockGetAdminRepository,
      mockUpdateAdminRepository,
    } = mockRepository();

    const hashProvider: HashProvider = createMock<HashProvider>();
    const mockCompareHash: jest.Mock = On(hashProvider).get(
      method((mock) => mock.compareHash),
    );

    const sut = new ChangeAdminPasswordUseCase(
      logger,
      adminRepository,
      hashProvider,
    );

    return {
      sut,
      mockGetAdminRepository,
      mockUpdateAdminRepository,
      mockCompareHash,
    };
  };

  const mockRepository = () => {
    const adminRepository: AdminRepository = createMock<AdminRepository>();
    const mockGetAdminRepository: jest.Mock = On(adminRepository).get(
      method((mock) => mock.getById),
    );
    const mockUpdateAdminRepository: jest.Mock = On(adminRepository).get(
      method((mock) => mock.update),
    );

    return {
      adminRepository,
      mockGetAdminRepository,
      mockUpdateAdminRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not be able to change admin password with missing parameters', async () => {
      const {
        sut,
        mockGetAdminRepository,
        mockUpdateAdminRepository,
        mockCompareHash,
      } = makeSut();

      const testScript = () => sut.execute(null, null, null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetAdminRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateAdminRepository).toHaveBeenCalledTimes(0);
      expect(mockCompareHash).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not be able to change admin password with invalid id', async () => {
      const {
        sut,
        mockGetAdminRepository,
        mockUpdateAdminRepository,
        mockCompareHash,
      } = makeSut();

      const admin = await AdminFactory.create<AdminEntity>(AdminEntity.name);

      mockGetAdminRepository.mockReturnValue(undefined);

      const testScript = () =>
        sut.execute(admin.id, admin.password, admin.password, admin.resetToken);

      await expect(testScript).rejects.toThrow(AdminNotFoundException);
      expect(mockGetAdminRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateAdminRepository).toHaveBeenCalledTimes(0);
      expect(mockCompareHash).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not be able change admin password with wrong confirm password', async () => {
      const {
        sut,
        mockGetAdminRepository,
        mockUpdateAdminRepository,
        mockCompareHash,
      } = makeSut();

      const admin = await AdminFactory.create<AdminEntity>(AdminEntity.name);
      mockGetAdminRepository.mockReturnValue(admin);
      mockCompareHash.mockReturnValue(false);

      const testScript = () =>
        sut.execute(
          admin.id,
          admin.password,
          'wrong_password',
          admin.resetToken,
        );

      await expect(testScript).rejects.toThrow(AdminPasswordInvalidException);
      expect(mockGetAdminRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateAdminRepository).toHaveBeenCalledTimes(0);
      expect(mockCompareHash).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not be able to change admin password with expired token', async () => {
      const {
        sut,
        mockGetAdminRepository,
        mockUpdateAdminRepository,
        mockCompareHash,
      } = makeSut();

      const admin = await AdminFactory.create<AdminEntity>(AdminEntity.name, {
        tokenExpirationTime: getMoment().subtract(1, 'day').toDate(),
      });
      mockGetAdminRepository.mockReturnValue(admin);
      mockCompareHash.mockReturnValue(false);

      const testScript = () =>
        sut.execute(admin.id, admin.password, admin.password, 'wrong_token');

      await expect(testScript).rejects.toThrow(
        AdminTokenExpirationTimeInvalidException,
      );
      expect(mockGetAdminRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateAdminRepository).toHaveBeenCalledTimes(0);
      expect(mockCompareHash).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not be able to change admin password with wrong resetToken', async () => {
      const {
        sut,
        mockGetAdminRepository,
        mockUpdateAdminRepository,
        mockCompareHash,
      } = makeSut();

      const admin = await AdminFactory.create<AdminEntity>(AdminEntity.name, {
        tokenExpirationTime: getMoment().add(1, 'day').toDate(),
      });
      mockGetAdminRepository.mockReturnValue(admin);
      mockCompareHash.mockReturnValue(false);

      const testScript = () =>
        sut.execute(admin.id, admin.password, admin.password, 'wrong_token');

      await expect(testScript).rejects.toThrow(
        AdminVerificationCodeInvalidException,
      );
      expect(mockGetAdminRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateAdminRepository).toHaveBeenCalledTimes(1);
      expect(mockCompareHash).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should be able to change admin password successfully', async () => {
      const {
        sut,
        mockGetAdminRepository,
        mockUpdateAdminRepository,
        mockCompareHash,
      } = makeSut();

      const admin = await AdminFactory.create<AdminEntity>(AdminEntity.name, {
        tokenExpirationTime: getMoment().add(1, 'day').toDate(),
      });

      mockGetAdminRepository.mockResolvedValue(admin);
      mockCompareHash.mockReturnValue(true);

      const result = await sut.execute(
        admin.id,
        admin.password,
        admin.password,
        'token',
      );

      expect(result).toBeUndefined();
      expect(mockGetAdminRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminRepository).toHaveBeenCalledWith(admin.id);
      expect(mockUpdateAdminRepository).toHaveBeenCalledTimes(1);
      expect(mockCompareHash).toHaveBeenCalledTimes(1);
    });
  });
});
