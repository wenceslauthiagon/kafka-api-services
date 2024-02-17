import { Logger } from 'winston';
import {
  PixKeyEvent,
  HandleClaimClosingFailedPixKeyEventUseCase as UseCase,
} from '@zro/pix-keys/application';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
} from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export type HandleClaimClosingFailedPixKeyEventRequest = PixKeyEvent;

export interface HandleClaimClosingFailedPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandleClaimClosingFailedPixKeyEventController {
  /**
   * Handler triggered when an error is thrown.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter PixKey event emitter.
   * @param logger Global logger.
   */
  constructor(
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    private logger: Logger,
  ) {
    this.logger = logger.child({
      context: HandleClaimClosingFailedPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: HandleClaimClosingFailedPixKeyEventRequest,
  ): Promise<HandleClaimClosingFailedPixKeyEventResponse> {
    const { id } = request;
    this.logger.debug('Handle claim closing failed event by Pix ID.', {
      request,
    });

    const pixKey = await this.usecase.execute(id);

    return handleClaimClosingFailedPixKeyEventPresenter(pixKey);
  }
}

export function handleClaimClosingFailedPixKeyEventPresenter(
  pixKey: PixKey,
): HandleClaimClosingFailedPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandleClaimClosingFailedPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
