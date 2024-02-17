import { Logger } from 'winston';
import {
  KeyState,
  KeyType,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { SyncPendingExpiredPixKeyUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface SyncPendingExpiredPixKeyResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function syncPendingExpiredPixKeyPresenter(
  pixKeys: PixKey[],
): SyncPendingExpiredPixKeyResponse[] {
  if (!pixKeys) return null;

  const response = pixKeys.map<SyncPendingExpiredPixKeyResponse>((pixKey) => ({
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  }));

  return response;
}

export class SyncPendingExpiredPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    timestamp: number,
  ) {
    this.logger = logger.child({
      context: SyncPendingExpiredPixKeyController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      eventEmitter,
      timestamp,
    );
  }

  async execute(): Promise<SyncPendingExpiredPixKeyResponse[]> {
    this.logger.debug('Sync pending pixKeys request.');

    const pixKeys = await this.usecase.execute();

    return syncPendingExpiredPixKeyPresenter(pixKeys);
  }
}
