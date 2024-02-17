import { Logger } from 'winston';
import {
  KeyState,
  KeyType,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { SyncPortabilityPendingExpiredPixKeyUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface SyncPortabilityPendingExpiredPixKeyResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function syncPortabilityPendingExpiredPixKeyPresenter(
  pixKeys: PixKey[],
): SyncPortabilityPendingExpiredPixKeyResponse[] {
  if (!pixKeys?.length) return null;

  const response = pixKeys.map<SyncPortabilityPendingExpiredPixKeyResponse>(
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

export class SyncPortabilityPendingExpiredPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    timestamp: number,
  ) {
    this.logger = logger.child({
      context: SyncPortabilityPendingExpiredPixKeyController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      eventEmitter,
      timestamp,
    );
  }

  async execute(): Promise<SyncPortabilityPendingExpiredPixKeyResponse[]> {
    this.logger.debug('Sync portability pending pixKeys request.');

    const pixKeys = await this.usecase.execute();

    return syncPortabilityPendingExpiredPixKeyPresenter(pixKeys);
  }
}
