import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { AdminEntity, AdminRepository } from '@zro/admin/domain';
import {
  AdminNotFoundException,
  HashProvider,
  SendForgetPasswordUseCase,
  NotificationService,
} from '@zro/admin/application';

describe('SendForgetPasswordUseCase', () => {
  const randomNumberSize = 6;
  const tokenAttempt = 3;

  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const emailTag = 'EMAIL_TAG';
    const emailFrom = 'email@test.com';

    const notificationService: NotificationService =
      createMock<NotificationService>();
    const mockSendEmailCode: jest.Mock = On(notificationService).get(
      method((mock) => mock.sendEmailCode),
    );

    const hashProvider: HashProvider = createMock<HashProvider>();
    const mockHashSync: jest.Mock = On(hashProvider).get(
      method((mock) => mock.hashSync),
    );

    const {
      adminRepository,
      mockGetAdminRepository,
      mockUpdateAdminRepository,
    } = mockRepository();

    const sut = new SendForgetPasswordUseCase(
      logger,
      adminRepository,
      notificationService,
      hashProvider,
      emailTag,
      emailFrom,
      randomNumberSize,
      tokenAttempt,
    );
    return {
      sut,
      mockGetAdminRepository,
      mockUpdateAdminRepository,
      mockSendEmailCode,
      mockHashSync,
    };
  };

  const mockRepository = () => {
    const adminRepository: AdminRepository = createMock<AdminRepository>();
    const mockGetAdminRepository: jest.Mock = On(adminRepository).get(
      method((mock) => mock.getByEmail),
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
    it('TC0001 - Should not send a forget password email to admin when no email passed', async () => {
      const {
        sut,
        mockGetAdminRepository,
        mockUpdateAdminRepository,
        mockSendEmailCode,
        mockHashSync,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetAdminRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateAdminRepository).toHaveBeenCalledTimes(0);
      expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      expect(mockHashSync).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not be able to send an forget password admin email not found', async () => {
      const {
        sut,
        mockGetAdminRepository,
        mockUpdateAdminRepository,
        mockSendEmailCode,
        mockHashSync,
      } = makeSut();

      const admin = new AdminEntity({ email: 'test@test.com' });
      mockGetAdminRepository.mockReturnValue(undefined);

      const testScript = () => sut.execute(admin.email);

      await expect(testScript).rejects.toThrow(AdminNotFoundException);
      expect(mockGetAdminRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateAdminRepository).toHaveBeenCalledTimes(0);
      expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      expect(mockHashSync).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should send forget admin password email successfully', async () => {
      const {
        sut,
        mockGetAdminRepository,
        mockUpdateAdminRepository,
        mockSendEmailCode,
        mockHashSync,
      } = makeSut();

      const admin = new AdminEntity({ id: 2022, email: 'test@test.com' });

      mockGetAdminRepository.mockResolvedValue(admin);
      mockHashSync.mockReturnValue('admin');

      const result = await sut.execute(admin.email);

      expect(result).toBeDefined();
      expect(mockSendEmailCode).toHaveBeenCalledTimes(1);
      expect(mockGetAdminRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminRepository).toHaveBeenCalledWith(admin.email);
      expect(mockUpdateAdminRepository).toHaveBeenCalledTimes(1);
      expect(mockHashSync).toHaveBeenCalledTimes(1);
    });
  });
});
