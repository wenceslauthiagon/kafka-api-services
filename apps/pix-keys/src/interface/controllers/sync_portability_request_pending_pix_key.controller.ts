import { Logger } from 'winston';
import {
  ClaimReasonType,
  KeyState,
  KeyType,
  PixKey,
  PixKeyClaimRepository,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { SyncPortabilityRequestPendingPixKeyUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface SyncPortabilityRequestPendingPixKeyRequest {
  reason: ClaimReasonType;
}

export interface SyncPortabilityRequestPendingPixKeyResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function syncPortabilityPendingRequestPixKeyPresenter(
  pixKeys: PixKey[],
): SyncPortabilityRequestPendingPixKeyResponse[] {
  if (!pixKeys) return null;

  const response = pixKeys.map<SyncPortabilityRequestPendingPixKeyResponse>(
    (pixKey) => ({
      id: pixKey.id,
      key: pixKey.key,
      type: pixKey.type,
      state: pixKey.state,
      createdAt: pixKey.createdAt,
    }),
  );

  return response;
}

export class SyncPortabilityRequestPendingPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    pixKeyClaimRepository: PixKeyClaimRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    timestamp: number,
  ) {
    this.logger = logger.child({
      context: SyncPortabilityRequestPendingPixKeyController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
      timestamp,
    );
  }

  async execute(
    request: SyncPortabilityRequestPendingPixKeyRequest,
  ): Promise<SyncPortabilityRequestPendingPixKeyResponse[]> {
    const { reason } = request;
    this.logger.debug('Sync portability request pending pixKeys request.', {
      request,
    });

    const pixKeys = await this.usecase.execute(reason);

    return syncPortabilityPendingRequestPixKeyPresenter(pixKeys);
  }
}
