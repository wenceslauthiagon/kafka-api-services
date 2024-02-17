import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { Signup, SignupRepository, SignupState } from '@zro/signup/domain';
import {
  SignupNotFoundException,
  SignupInvalidStateException,
  CreateUserRequest,
  UserService,
  SignupEventEmitter,
  SignupEvent,
} from '@zro/signup/application';
import { UserAlreadyExistsException } from '@zro/users/application';

export class HandleConfirmedSignupUseCase {
  /**
   * Default constructor.
   */
  constructor(
    private logger: Logger,
    private readonly signupRepository: SignupRepository,
    private readonly userService: UserService,
    private readonly eventEmitter: SignupEventEmitter,
  ) {
    this.logger = logger.child({ context: HandleConfirmedSignupUseCase.name });
  }

  /**
   * Send signup authentication code.
   *
   * @param signup Signup.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(signup: Signup): Promise<Signup> {
    if (!signup?.id) {
      throw new MissingDataException(['signup Id']);
    }

    const foundSignup = await this.signupRepository.getById(signup.id);

    this.logger.debug('Found Signup by id.', { signup: foundSignup });

    if (!foundSignup) {
      throw new SignupNotFoundException(signup);
    }

    // Check idempotency
    if (foundSignup.isFinalState()) {
      return foundSignup;
    }

    if (foundSignup.state === SignupState.CONFIRMED) {
      const userId = uuidV4();
      const { name, phoneNumber, referralCode, password, confirmCode, email } =
        foundSignup;

      const request: CreateUserRequest = {
        id: userId,
        name,
        phoneNumber,
        referralCode,
        password,
        confirmCode,
        email,
      };

      try {
        const createdUser = await this.userService.createUser(request);

        foundSignup.user = new UserEntity({ uuid: createdUser.id });
        foundSignup.state = SignupState.READY;

        this.logger.info('User created.', { user: createdUser });
      } catch (error) {
        if (error instanceof UserAlreadyExistsException) {
          foundSignup.state = SignupState.DUPLICATED;
          foundSignup.duplicate = error.data;

          this.logger.info('User duplicated.', { signup: foundSignup });
        } else {
          throw error;
        }
      }

      await this.signupRepository.update(foundSignup);
    } else {
      throw new SignupInvalidStateException(foundSignup);
    }

    const event: SignupEvent = {
      id: foundSignup.id,
      state: foundSignup.state,
      phoneNumber: foundSignup.phoneNumber,
    };

    switch (foundSignup.state) {
      case SignupState.DUPLICATED:
        this.eventEmitter.duplicateSignup(event);
        break;
      case SignupState.READY:
        this.eventEmitter.readySignup(event);
        break;
    }

    return foundSignup;
  }
}
