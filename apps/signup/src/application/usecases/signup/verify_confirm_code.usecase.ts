import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Signup, SignupRepository, SignupState } from '@zro/signup/domain';
import {
  SignupEvent,
  SignupEventEmitter,
  SignupInvalidStateException,
  SignupNotFoundException,
} from '@zro/signup/application';

export class VerifyConfirmCodeSignupUseCase {
  /**
   * Default constructor.
   */
  constructor(
    private logger: Logger,
    private readonly signupRepository: SignupRepository,
    private readonly maxNumberOfAttempts: number,
    private readonly eventEmitter: SignupEventEmitter,
  ) {
    this.logger = logger.child({
      context: VerifyConfirmCodeSignupUseCase.name,
    });
  }

  /**
   * Send signup authentication code.
   *
   * @param signup Signup.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(signup: Signup, confirmCode: string): Promise<Signup> {
    if (!signup?.id || !confirmCode) {
      throw new MissingDataException([
        ...(!signup?.id ? ['signup Id'] : []),
        ...(!confirmCode ? ['confirmCode'] : []),
      ]);
    }

    const foundSignup = await this.signupRepository.getById(signup.id);

    this.logger.debug('Found Signup by id.', { signup: foundSignup });

    if (!foundSignup) {
      throw new SignupNotFoundException({ id: signup.id });
    }

    if (!foundSignup.isPending()) {
      throw new SignupInvalidStateException({ id: signup.id });
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

    if (foundSignup.confirmAttempts < this.maxNumberOfAttempts) {
      if (foundSignup.confirmCode === confirmCode) {
        this.logger.info('Confirmed phone number by code signup.');

        foundSignup.state = SignupState.CONFIRMED;
      } else {
        this.logger.info('Confirm code error.');

        foundSignup.confirmAttempts++;

        if (foundSignup.confirmAttempts >= this.maxNumberOfAttempts) {
          this.logger.info(
            'Number of attempts to confirm phone number by code exceeded.',
          );

          foundSignup.state = SignupState.NOT_CONFIRMED;
        }
      }

      // Update signup.
      await this.signupRepository.update(foundSignup);

      const event: SignupEvent = {
        id: foundSignup.id,
        phoneNumber: foundSignup.phoneNumber,
        state: foundSignup.state,
      };
      switch (foundSignup.state) {
        case SignupState.CONFIRMED:
          this.eventEmitter.confirmSignup(event);
          break;
        case SignupState.NOT_CONFIRMED:
          this.eventEmitter.notConfirmSignup(event);
          break;
      }
    } else {
      this.logger.info('Verify code error');
    }

    return foundSignup;
  }
}
