import { Logger } from 'winston';
import { UserEntity } from '@zro/users/domain';
import {
  KeyState,
  KeyType,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { DismissByIdPixKeyUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface DismissByIdPixKeyRequest {
  userId: string;
  id: string;
}

export interface DismissByIdPixKeyResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function dismissByIdPixKeyPresenter(pixKey: PixKey): DismissByIdPixKeyResponse {
  if (!pixKey) return null;

  const response: DismissByIdPixKeyResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class DismissByIdPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({ context: DismissByIdPixKeyController.name });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: DismissByIdPixKeyRequest,
  ): Promise<DismissByIdPixKeyResponse> {
    const { userId, id } = request;
    this.logger.debug('Dismiss by Pix ID.', { request });

    const user = new UserEntity({ uuid: userId });

    const pixKey = await this.usecase.execute(user, id);

    return dismissByIdPixKeyPresenter(pixKey);
  }
}
