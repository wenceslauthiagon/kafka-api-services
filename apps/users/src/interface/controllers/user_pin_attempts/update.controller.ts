import { Logger } from 'winston';
import {
  UserEntity,
  UserPinAttempts,
  UserPinAttemptsRepository,
  UserRepository,
} from '@zro/users/domain';
import { UpdateUserPinAttemptsUseCase } from '@zro/users/application';
import {
  UserPinAttemptsEventEmitterController,
  UserPinAttemptsEventEmitterControllerInterface,
} from '@zro/users/interface';

export interface UpdateUserPinAttemptsRequest {
  /**
   * User's UUID.
   */
  userId: string;

  /**
   * Number of attempts to validate the pin.
   */
  attempts?: number;
}

export interface UpdateUserPinAttemptsResponse {
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

function updateUserPinAttemptsPresenter(
  userAttempts: UserPinAttempts,
): UpdateUserPinAttemptsResponse {
  if (!userAttempts) return null;

  const response: UpdateUserPinAttemptsResponse = {
    id: userAttempts.uuid,
    userId: userAttempts.user.uuid,
    pin: userAttempts.user.pin,
    pinHasCreated: userAttempts.user.pinHasCreated,
    attempts: userAttempts.attempts,
    updatedAt: userAttempts.updatedAt,
  };

  return response;
}

export class UpdateUserPinAttemptsController {
  private usecase: UpdateUserPinAttemptsUseCase;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
    userPinAttempts: UserPinAttemptsRepository,
    eventEmitter: UserPinAttemptsEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: UpdateUserPinAttemptsController.name,
    });

    const emitterController = new UserPinAttemptsEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UpdateUserPinAttemptsUseCase(
      this.logger,
      userRepository,
      userPinAttempts,
      emitterController,
    );
  }

  async execute(
    request: UpdateUserPinAttemptsRequest,
  ): Promise<UpdateUserPinAttemptsResponse> {
    this.logger.debug('Updating user pin attempts.', { request });

    const user = new UserEntity({ uuid: request.userId });

    const userPinAttempts = await this.usecase.execute(
      user,
      request.attempts ?? 0,
    );

    return updateUserPinAttemptsPresenter(userPinAttempts);
  }
}
