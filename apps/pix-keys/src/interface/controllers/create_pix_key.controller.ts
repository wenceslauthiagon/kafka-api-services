import { Logger } from 'winston';
import { formatPhone } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  KeyState,
  KeyType,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  CreatePixKeyUseCase as UseCase,
  UserService,
} from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface CreatePixKeyRequest {
  userId: string;
  id: string;
  type: KeyType;
  key?: string;
}

export interface CreatePixKeyResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function createPixKeyPresenter(pixKey: PixKey): CreatePixKeyResponse {
  if (!pixKey) return null;

  const response: CreatePixKeyResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class CreatePixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    userService: UserService,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    naturalPersonMaxNumberOfKeys: number,
    legalPersonMaxNumberOfKeys: number,
  ) {
    this.logger = logger.child({ context: CreatePixKeyController.name });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      userService,
      eventEmitter,
      naturalPersonMaxNumberOfKeys,
      legalPersonMaxNumberOfKeys,
    );
  }

  async execute(request: CreatePixKeyRequest): Promise<CreatePixKeyResponse> {
    this.logger.debug('Create Pix key request.', { request });

    const { id, userId, type } = request;
    let key = request.key;

    const user = new UserEntity({ uuid: userId });
    if (type === KeyType.PHONE) {
      key = formatPhone(key);
    }

    const pixKey = await this.usecase.execute(id, user, type, key);

    return createPixKeyPresenter(pixKey);
  }
}
