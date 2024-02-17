import { Logger } from 'winston';
import { createRandomNumberCode, MissingDataException } from '@zro/common';
import {
  Signup,
  SignupEntity,
  SignupRepository,
  SignupState,
} from '@zro/signup/domain';
import { UserService } from '@zro/signup/application';
export class CreateSignupUseCase {
  /**
   * Default constructor.
   *
   */
  constructor(
    private logger: Logger,
    private readonly signupRepository: SignupRepository,
    private readonly userService: UserService,
  ) {
    this.logger = logger.child({ context: CreateSignupUseCase.name });
  }

  /**
   * Create user.
   *
   * @param signup Signup data.
   * @returns The created signup.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(signup: Partial<Signup>): Promise<Signup> {
    if (!signup?.email || !signup?.id) {
      throw new MissingDataException([
        ...(!signup?.id ? ['Id'] : []),
        ...(!signup?.email ? ['Email'] : []),
      ]);
    }

    const foundSignup = await this.signupRepository.getById(signup.id);

    // Check idempotency
    if (foundSignup) {
      return foundSignup;
    }

    // Check if email is available
    const userFoundByEmail = await this.userService.getUserByEmail({
      email: signup.email,
    });

    this.logger.debug('User found.', { user: userFoundByEmail });

    if (userFoundByEmail) {
      return;
    }

    const newSignup = new SignupEntity(signup);

    newSignup.confirmCode = createRandomNumberCode(5);
    newSignup.state = SignupState.PENDING;

    const createdSignup = await this.signupRepository.create(newSignup);

    this.logger.debug('Signup created.', { createdSignup });

    return createdSignup;
  }
}
