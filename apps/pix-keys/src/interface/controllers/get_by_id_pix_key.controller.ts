import { Logger } from 'winston';
import { Failed } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  KeyState,
  KeyType,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { GetByIdPixKeyUseCase as UseCase } from '@zro/pix-keys/application';

export interface GetByIdPixKeyRequest {
  userId: string;
  id: string;
}

export interface GetByIdPixKeyResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
  failed?: Failed;
}

function getByIdPixKeyPresenter(pixKey: PixKey): GetByIdPixKeyResponse {
  if (!pixKey) return null;

  const response: GetByIdPixKeyResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
    failed: pixKey.failed,
  };

  return response;
}

export class GetByIdPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
  ) {
    this.logger = logger.child({
      context: GetByIdPixKeyController.name,
    });
    this.usecase = new UseCase(this.logger, pixKeyRepository);
  }

  async execute(request: GetByIdPixKeyRequest): Promise<GetByIdPixKeyResponse> {
    const { userId, id } = request;
    this.logger.debug('Get by Pix ID associated with the user.', { request });

    const user = new UserEntity({ uuid: userId });

    const pixKey = await this.usecase.execute(user, id);

    return getByIdPixKeyPresenter(pixKey);
  }
}
