import { Logger } from 'winston';
import {
  ClaimReasonType,
  KeyState,
  KeyType,
  PixKey,
  PixKeyClaimRepository,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { SyncClaimPendingExpiredPixKeyUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface SyncClaimPendingExpiredPixKeyRequest {
  reason: ClaimReasonType;
}

export interface SyncClaimPendingExpiredPixKeyResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function syncClaimPendingExpiredPixKeyPresenter(
  pixKeys: PixKey[],
): SyncClaimPendingExpiredPixKeyResponse[] {
  if (!pixKeys) return null;

  const response = pixKeys.map<SyncClaimPendingExpiredPixKeyResponse>(
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

export class SyncClaimPendingExpiredPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    pixKeyClaimRepository: PixKeyClaimRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    timestamp: number,
  ) {
    this.logger = logger.child({
      context: SyncClaimPendingExpiredPixKeyController.name,
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
    request: SyncClaimPendingExpiredPixKeyRequest,
  ): Promise<SyncClaimPendingExpiredPixKeyResponse[]> {
    const { reason } = request;
    this.logger.debug('Sync claim pending pixKeys request.', { request });

    const pixKeys = await this.usecase.execute(reason);

    return syncClaimPendingExpiredPixKeyPresenter(pixKeys);
  }
}
