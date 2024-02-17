import { Logger } from 'winston';
import {
  KeyState,
  KeyType,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { SyncOwnershipPendingExpiredPixKeyUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface SyncOwnershipPendingExpiredPixKeyResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function syncOwnershipPendingExpiredPixKeyPresenter(
  pixKeys: PixKey[],
): SyncOwnershipPendingExpiredPixKeyResponse[] {
  if (!pixKeys) return null;

  const response = pixKeys.map<SyncOwnershipPendingExpiredPixKeyResponse>(
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

export class SyncOwnershipPendingExpiredPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    timestamp: number,
  ) {
    this.logger = logger.child({
      context: SyncOwnershipPendingExpiredPixKeyController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      eventEmitter,
      timestamp,
    );
  }

  async execute(): Promise<SyncOwnershipPendingExpiredPixKeyResponse[]> {
    this.logger.debug('Sync ownership pending pixKeys request.');

    const pixKeys = await this.usecase.execute();

    return syncOwnershipPendingExpiredPixKeyPresenter(pixKeys);
  }
}
