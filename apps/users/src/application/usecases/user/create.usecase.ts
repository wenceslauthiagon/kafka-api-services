import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User, UserEntity, UserRepository, UserState } from '@zro/users/domain';
import {
  HashProvider,
  UserAlreadyExistsException,
  UserEventEmitter,
} from '@zro/users/application';

export class CreateUserUseCase {
  /**
   * Default constructor.
   *
   */
  constructor(
    private logger: Logger,
    private readonly userRepository: UserRepository,
    private readonly hashProvider: HashProvider,
    private readonly eventEmitter: UserEventEmitter,
  ) {
    this.logger = logger.child({ context: CreateUserUseCase.name });
  }

  /**
   * Create user.
   *
   * @param id User uuid.
   * @param name User name.
   * @param phoneNumber User phone number.
   * @param referralCode Identification of the user who referred the app.
   * @returns The created user.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    id: string,
    name: string,
    phoneNumber: string,
    password: string,
    confirmCode: string,
    email: string,
    referralCode?: string,
  ): Promise<User> {
    // Data input check
    if (!id || !name || !phoneNumber || !password || !confirmCode || !email) {
      throw new MissingDataException([
        ...(!id ? ['Id'] : []),
        ...(!name ? ['Name'] : []),
        ...(!phoneNumber ? ['Phone Number'] : []),
        ...(!password ? ['Password'] : []),
        ...(!confirmCode ? ['Confirm Code'] : []),
        ...(!email ? ['Email'] : []),
      ]);
    }

    let referredBy = null;

    const existingUser =
      await this.userRepository.getByPhoneNumber(phoneNumber);
    this.logger.debug('Found User by phone number.', { user: existingUser });

    // already exist user with same phone number
    if (existingUser) {
      if (existingUser.state === UserState.ACTIVE) {
        throw new UserAlreadyExistsException(existingUser);
      }

      // LEGACY CODE!
      // Remove previous user: set phone to a random number
      existingUser.phoneNumber = `dup_${phoneNumber}_${this.genRandValue(
        5,
        32,
      )}`;

      await this.userRepository.update(existingUser);
      await this.userRepository.delete(existingUser);
    }

    const existingEmail = await this.userRepository.getByEmail(email);

    if (referralCode) {
      referredBy = await this.userRepository.getByReferralCode(referralCode);
      this.logger.debug('User found by referral code.', { referredBy });
    }

    const user = new UserEntity({
      uuid: id,
      password,
      pin: this.genRandomHash(4, 10),
      pinHasCreated: false,
      eula: true,
      phoneNumber,
      active: true,
      state: UserState.ACTIVE,
      name,
      email: existingEmail ? null : email,
      confirmCode: parseInt(confirmCode),
      referredBy,
    });

    const newUser = await this.userRepository.create(user);

    // Fire created user
    this.eventEmitter.pendingUser(newUser);

    this.logger.debug('User created.', { user: newUser });

    return newUser;
  }

  private genRandValue(size: number, base: number): string {
    return Math.random().toString(base).slice(-size);
  }

  private genRandomHash(
    passwordSize: number,
    numericBase: number,
    salt = 10,
  ): string {
    const randomPassword = this.genRandValue(numericBase, passwordSize);
    return this.hashProvider.hashSync(randomPassword, salt);
  }
}
