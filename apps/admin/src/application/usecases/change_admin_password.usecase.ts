import { Logger } from 'winston';
import { MissingDataException, isDateBeforeThan } from '@zro/common';
import { AdminRepository } from '@zro/admin/domain';
import {
  AdminNotFoundException,
  AdminTokenAttemptInvalidException,
  AdminVerificationCodeInvalidException,
  AdminTokenExpirationTimeInvalidException,
  AdminPasswordInvalidException,
  HashProvider,
} from '@zro/admin/application';

export class ChangeAdminPasswordUseCase {
  constructor(
    private logger: Logger,
    private readonly adminRepository: AdminRepository,
    private readonly hashProvider: HashProvider,
  ) {
    this.logger = logger.child({ context: ChangeAdminPasswordUseCase.name });
  }

  /**
   * Send verification code.
   *
   * @param id Admin ID
   * @param password Admin password
   * @param confirmPassword ConfirmPassword property
   * @param verificationCode VerificationCode as Admin resetToken
   * @throws {AdminNotFoundException} Thrown when Admin was not found.
   */
  async execute(
    id: number,
    password: string,
    confirmPassword: string,
    verificationCode: string,
  ): Promise<void> {
    // Data input check
    if (!id || !password || !confirmPassword || !verificationCode) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!password ? ['Password'] : []),
        ...(!confirmPassword ? ['ConfirmPassword'] : []),
        ...(!verificationCode ? ['VerificationCode'] : []),
      ]);
    }

    // Search user admin
    const admin = await this.adminRepository.getById(id);

    this.logger.debug('Found user admin.', { admin });

    if (!admin) throw new AdminNotFoundException({ id });

    if (password !== confirmPassword) {
      throw new AdminPasswordInvalidException(admin);
    }

    if (isDateBeforeThan(admin.tokenExpirationTime)) {
      throw new AdminTokenExpirationTimeInvalidException(admin);
    }

    const isTokenMatch = this.hashProvider.compareHash(
      verificationCode,
      admin.resetToken,
    );

    if (!isTokenMatch) {
      await this.adminRepository.update({
        ...admin,
        tokenAttempt: admin.tokenAttempt - 1,
      });
      throw new AdminVerificationCodeInvalidException(admin);
    }

    if (admin.tokenAttempt <= 0) {
      throw new AdminTokenAttemptInvalidException(admin);
    }

    const hashedPassword = this.hashProvider.hashSync(password, 8);

    // update resetToken and tokenAttempt
    await this.adminRepository.update({
      ...admin,
      password: hashedPassword,
      resetToken: null,
    });

    this.logger.debug('Password has been changed at admin database.');
  }
}
