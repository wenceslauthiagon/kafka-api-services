import { Logger } from 'winston';
import { UserEntity } from '@zro/users/domain';
import {
  KeyState,
  KeyType,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { CancelStartPortabilityProcessByIdPixKeyUseCase as UseCase } from '@zro/pix-keys/application';

export interface CancelStartPortabilityProcessByIdPixKeyRequest {
  userId: string;
  id: string;
}

export interface CancelStartPortabilityProcessByIdPixKeyResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function cancelStartPortabilityProcessByIdPixKeyPresenter(
  pixKey: PixKey,
): CancelStartPortabilityProcessByIdPixKeyResponse {
  if (!pixKey) return null;

  const response: CancelStartPortabilityProcessByIdPixKeyResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class CancelStartPortabilityProcessByIdPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
  ) {
    this.logger = logger.child({
      context: CancelStartPortabilityProcessByIdPixKeyController.name,
    });
    this.usecase = new UseCase(this.logger, pixKeyRepository);
  }

  async execute(
    request: CancelStartPortabilityProcessByIdPixKeyRequest,
  ): Promise<CancelStartPortabilityProcessByIdPixKeyResponse> {
    const { userId, id } = request;
    this.logger.debug('Cancel start portability process by Pix ID.', {
      request,
    });

    const user = new UserEntity({ uuid: userId });

    const pixKey = await this.usecase.execute(user, id);

    return cancelStartPortabilityProcessByIdPixKeyPresenter(pixKey);
  }
}
