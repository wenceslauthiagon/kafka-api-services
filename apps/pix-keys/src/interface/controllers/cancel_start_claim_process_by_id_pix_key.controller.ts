import { Logger } from 'winston';
import { UserEntity } from '@zro/users/domain';
import {
  KeyState,
  KeyType,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { CancelStartClaimProcessByIdPixKeyUseCase as UseCase } from '@zro/pix-keys/application';

export interface CancelStartClaimProcessByIdPixKeyRequest {
  userId: string;
  id: string;
}

export interface CancelStartClaimProcessByIdPixKeyResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function cancelStartClaimProcessByIdPixKeyPresenter(
  pixKey: PixKey,
): CancelStartClaimProcessByIdPixKeyResponse {
  if (!pixKey) return null;

  const response: CancelStartClaimProcessByIdPixKeyResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class CancelStartClaimProcessByIdPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
  ) {
    this.logger = logger.child({
      context: CancelStartClaimProcessByIdPixKeyController.name,
    });
    this.usecase = new UseCase(this.logger, pixKeyRepository);
  }

  async execute(
    request: CancelStartClaimProcessByIdPixKeyRequest,
  ): Promise<CancelStartClaimProcessByIdPixKeyResponse> {
    const { userId, id } = request;
    this.logger.debug('Cancel claim start process by Pix ID.', { request });

    const user = new UserEntity({ uuid: userId });

    const pixKey = await this.usecase.execute(user, id);

    return cancelStartClaimProcessByIdPixKeyPresenter(pixKey);
  }
}
