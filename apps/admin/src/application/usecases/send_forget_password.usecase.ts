import { Logger } from 'winston';
import {
  MissingDataException,
  createRandomNumberCode,
  generateTokenExpirationTime,
} from '@zro/common';
import { Admin, AdminRepository } from '@zro/admin/domain';
import {
  AdminNotFoundException,
  NotificationService,
  HashProvider,
} from '@zro/admin/application';

export class SendForgetPasswordUseCase {
  private readonly saltOrRounds = 8;

  constructor(
    private logger: Logger,
    private readonly adminRepository: AdminRepository,
    private readonly notificationService: NotificationService,
    private readonly hashProvider: HashProvider,
    private readonly emailTag: string,
    private readonly emailFrom: string,
    private readonly randomNumberSize: number,
    private readonly tokenAttempt: number,
  ) {
    this.logger = logger.child({ context: SendForgetPasswordUseCase.name });
  }

  /**
   * Send verification code.
   *
   * @param email Admin email
   * @throws {AdminNotFoundException} Thrown when Admin was not found.
   */
  async execute(email: string): Promise<Admin> {
    // Data input check
    if (!email) {
      throw new MissingDataException(['Email']);
    }

    // Search user admin
    const existentAdmin = await this.adminRepository.getByEmail(email);

    this.logger.debug('Found user admin.', { existentAdmin });

    if (!existentAdmin) {
      throw new AdminNotFoundException({ email });
    }

    const verificationCode = createRandomNumberCode(this.randomNumberSize);

    // Send code by e-mail.
    const notificationEmail = await this.notificationService.sendEmailCode(
      existentAdmin,
      verificationCode,
      this.emailFrom,
      this.emailTag,
    );

    this.logger.debug('Send forget password email with code.', {
      notificationEmail,
    });

    const hashedVerificationCode = this.hashProvider.hashSync(
      verificationCode,
      this.saltOrRounds,
    );

    // Update resetToken and tokenAttempt.
    const updatedAdmin = await this.adminRepository.update({
      ...existentAdmin,
      resetToken: hashedVerificationCode,
      tokenAttempt: this.tokenAttempt,
      tokenExpirationTime: generateTokenExpirationTime(),
    });

    this.logger.debug('Update Admin at database.', { updatedAdmin });

    return existentAdmin;
  }
}
