import { Logger } from 'winston';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import { WaitPortabilityClaimProcessUseCase as UseCase } from '@zro/pix-keys/application';

export interface WaitPortabilityClaimProcessRequest {
  key: string;
}

export interface WaitPortabilityClaimProcessResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function waitPortabilityClaimProcessPresenter(
  pixKey: PixKey,
): WaitPortabilityClaimProcessResponse {
  if (!pixKey) return null;

  const response: WaitPortabilityClaimProcessResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class WaitPortabilityClaimProcessController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    pixKeyClaimRepository: PixKeyClaimRepository,
  ) {
    this.logger = logger.child({
      context: WaitPortabilityClaimProcessController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      pixKeyClaimRepository,
    );
  }

  async execute(
    request: WaitPortabilityClaimProcessRequest,
  ): Promise<WaitPortabilityClaimProcessResponse> {
    const { key } = request;
    this.logger.debug('Wait portability process.', { request });

    const pixKey = await this.usecase.execute(key);

    return waitPortabilityClaimProcessPresenter(pixKey);
  }
}
