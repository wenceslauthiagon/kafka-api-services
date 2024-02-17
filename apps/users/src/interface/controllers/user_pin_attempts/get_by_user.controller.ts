import { Logger } from 'winston';
import {
  UserEntity,
  UserPinAttempts,
  UserPinAttemptsRepository,
  UserRepository,
} from '@zro/users/domain';
import { GetUserPinAttemptsByUserUseCase } from '@zro/users/application';
import {
  UserPinAttemptsEventEmitterController,
  UserPinAttemptsEventEmitterControllerInterface,
} from '@zro/users/interface';

export interface GetUserPinAttemptsByUserRequest {
  /**
   * User's UUID.
   */
  userId: string;
}

export interface GetUserPinAttemptsByUserResponse {
  /**
   * Attempts UUID (new version).
   */
  id: string;

  /**
   * User owner UUID
   */
  userId: string;

  /**
   * User's pin hash.
   */
  pin: string;

  /**
   * True if user has already created the pin.
   */
  pinHasCreated: boolean;

  /**
   * Number of attempts to validate the pin.
   */
  attempts: number;

  /**
   * Last time user tried to verify the pin.
   */
  updatedAt: Date;
}

function getUserPinAttemptsByUserPresenter(
  userAttempts: UserPinAttempts,
): GetUserPinAttemptsByUserResponse {
  if (!userAttempts) return null;

  const response: GetUserPinAttemptsByUserResponse = {
    id: userAttempts.uuid,
    userId: userAttempts.user.uuid,
    pin: userAttempts.user.pin,
    pinHasCreated: userAttempts.user.pinHasCreated,
    attempts: userAttempts.attempts,
    updatedAt: userAttempts.updatedAt,
  };

  return response;
}

export class GetUserPinAttemptsByUserController {
  private usecase: GetUserPinAttemptsByUserUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
    userPinAttempts: UserPinAttemptsRepository,
    eventEmitter: UserPinAttemptsEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: GetUserPinAttemptsByUserController.name,
    });

    const userPixAttemptsEventEmitter =
      new UserPinAttemptsEventEmitterController(eventEmitter);

    this.usecase = new GetUserPinAttemptsByUserUseCase(
      this.logger,
      userRepository,
      userPinAttempts,
      userPixAttemptsEventEmitter,
    );
  }

  async execute(
    request: GetUserPinAttemptsByUserRequest,
  ): Promise<GetUserPinAttemptsByUserResponse> {
    this.logger.debug('Getting onboarding by user request.', { request });

    const { userId } = request;

    const user = new UserEntity({ uuid: userId });

    const userPinAttempts = await this.usecase.execute(user);

    return getUserPinAttemptsByUserPresenter(userPinAttempts);
  }
}
