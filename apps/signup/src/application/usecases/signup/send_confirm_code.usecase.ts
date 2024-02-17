import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Signup, SignupRepository } from '@zro/signup/domain';
import { NotificationService } from '@zro/signup/application';

export class SendConfirmCodeSignupUseCase {
  /**
   * Default constructor.
   */
  constructor(
    private logger: Logger,
    private readonly signupRepository: SignupRepository,
    private readonly notificationService: NotificationService,
    private readonly emailTag: string,
    private readonly emailFrom: string,
  ) {
    this.logger = logger.child({ context: SendConfirmCodeSignupUseCase.name });
  }

  /**
   * Send signup confirm code.
   *
   * @param signup Signup.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(signup: Signup): Promise<void> {
    if (!signup?.id) {
      throw new MissingDataException(['Signup Id']);
    }

    const foundSignup = await this.signupRepository.getById(signup.id);

    this.logger.debug('Found signup by uuid.', { signup: foundSignup });

    if (!foundSignup || !foundSignup.isPending()) {
      return;
    }

    if (
      !foundSignup.name ||
      !foundSignup.password ||
      !foundSignup.phoneNumber ||
      !foundSignup.email
    ) {
      throw new MissingDataException([
        ...(!foundSignup.name ? ['Name'] : []),
        ...(!foundSignup.password ? ['Password'] : []),
        ...(!foundSignup.phoneNumber ? ['Phone Number'] : []),
        ...(!foundSignup.email ? ['Email'] : []),
      ]);
    }

    await this.notificationService.sendEmailCode(
      foundSignup,
      this.emailTag,
      this.emailFrom,
    );
    this.logger.debug('Sent signup confirm code to email.');
  }
}
