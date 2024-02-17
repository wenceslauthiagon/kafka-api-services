import { Logger } from 'winston';
import {
  KeyState,
  KeyType,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { GetByKeyPixKeyUseCase as UseCase } from '@zro/pix-keys/application';

export interface GetByKeyPixKeyRequest {
  key: string;
}

export interface GetByKeyPixKeyResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function getByKeyPixKeyPresenter(pixKey: PixKey): GetByKeyPixKeyResponse {
  if (!pixKey) return null;

  const response: GetByKeyPixKeyResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class GetByKeyPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
  ) {
    this.logger = logger.child({
      context: GetByKeyPixKeyController.name,
    });
    this.usecase = new UseCase(this.logger, pixKeyRepository);
  }

  async execute(
    request: GetByKeyPixKeyRequest,
  ): Promise<GetByKeyPixKeyResponse> {
    const { key } = request;
    this.logger.debug('Get by Pix Key.', { request });

    const pixKey = await this.usecase.execute(key);

    return getByKeyPixKeyPresenter(pixKey);
  }
}
