import { Logger } from 'winston';
import { UserEntity } from '@zro/users/domain';
import {
  PixKeyReasonType,
  KeyState,
  KeyType,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { DeleteByIdPixKeyUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface DeleteByIdPixKeyRequest {
  userId: string;
  id: string;
  reason: PixKeyReasonType;
}

export interface DeleteByIdPixKeyResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function deleteByIdPixKeyPresenter(pixKey: PixKey): DeleteByIdPixKeyResponse {
  if (!pixKey) return null;

  const response: DeleteByIdPixKeyResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class DeleteByIdPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({ context: DeleteByIdPixKeyController.name });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: DeleteByIdPixKeyRequest,
  ): Promise<DeleteByIdPixKeyResponse> {
    const { userId, id, reason } = request;
    this.logger.debug('Delete by Pix ID.', { request });

    const user = new UserEntity({ uuid: userId });

    const pixKey = await this.usecase.execute(user, id, reason);

    return deleteByIdPixKeyPresenter(pixKey);
  }
}
