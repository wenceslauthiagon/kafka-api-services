import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { SignupRepository, Signup } from '@zro/signup/domain';

export class GetSignupByIdUseCase {
  constructor(
    private logger: Logger,
    private readonly signupRepository: SignupRepository,
  ) {
    this.logger = logger.child({ context: GetSignupByIdUseCase.name });
  }

  async execute(id: string): Promise<Signup> {
    if (!id) {
      throw new MissingDataException(['id']);
    }

    const signup = await this.signupRepository.getById(id);

    this.logger.debug('Signup found.', { signup });

    return signup;
  }
}
