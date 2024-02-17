import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Signup, SignupRepository } from '@zro/signup/domain';
import {
  SignupInvalidStateException,
  SignupNotFoundException,
} from '@zro/signup/application';

export class UpdateSignupUseCase {
  /**
   * Default constructor.
   *
   */
  constructor(
    private logger: Logger,
    private readonly signupRepository: SignupRepository,
  ) {
    this.logger = logger.child({ context: UpdateSignupUseCase.name });
  }

  /**
   * Update user.
   *
   * @param signup Signup data.
   * @returns The updated signup.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(signup: Signup): Promise<Signup> {
    if (!signup?.id) {
      throw new MissingDataException(['signup Id']);
    }

    const foundSignup = await this.signupRepository.getById(signup.id);

    if (!foundSignup) {
      throw new SignupNotFoundException({ id: signup.id });
    }

    if (!foundSignup.isPending()) {
      throw new SignupInvalidStateException(foundSignup);
    }

    // Override old values with new ones.
    Object.assign(foundSignup, signup);

    // Update signup.
    const updatedSignup = await this.signupRepository.update(foundSignup);

    this.logger.debug('Signup updated.', { user: updatedSignup });

    return updatedSignup;
  }
}
