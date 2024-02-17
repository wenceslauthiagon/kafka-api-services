import { Logger } from 'winston';
import { UserEntity } from '@zro/users/domain';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
  ClaimReasonType,
} from '@zro/pix-keys/domain';
import { CancelingOwnershipClaimProcessUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface CancelingOwnershipClaimProcessRequest {
  userId: string;
  id: string;
  reason: ClaimReasonType;
}

export interface CancelingOwnershipClaimProcessResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function cancelingOwnershipClaimProcessPresenter(
  pixKey: PixKey,
): CancelingOwnershipClaimProcessResponse {
  if (!pixKey) return null;

  const response: CancelingOwnershipClaimProcessResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class CancelingOwnershipClaimProcessController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CancelingOwnershipClaimProcessController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: CancelingOwnershipClaimProcessRequest,
  ): Promise<CancelingOwnershipClaimProcessResponse> {
    this.logger.debug('Canceling ownership process.', { request });

    const { userId, id, reason } = request;

    const user = new UserEntity({ uuid: userId });

    const pixKey = await this.usecase.execute(user, id, reason);

    return cancelingOwnershipClaimProcessPresenter(pixKey);
  }
}
