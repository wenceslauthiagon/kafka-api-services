import { Logger } from 'winston';
import {
  PixKeyEvent,
  HandleClaimDeniedFailedPixKeyEventUseCase as UseCase,
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

export type HandleClaimDeniedFailedPixKeyEventRequest = PixKeyEvent;

export interface HandleClaimDeniedFailedPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandleClaimDeniedFailedPixKeyEventController {
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
      context: HandleClaimDeniedFailedPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: HandleClaimDeniedFailedPixKeyEventRequest,
  ): Promise<HandleClaimDeniedFailedPixKeyEventResponse> {
    const { id } = request;
    this.logger.debug('Handle claim denied failed event by Pix ID.', {
      request,
    });

    const pixKey = await this.usecase.execute(id);

    return handleClaimDeniedFailedPixKeyEventPresenter(pixKey);
  }
}

export function handleClaimDeniedFailedPixKeyEventPresenter(
  pixKey: PixKey,
): HandleClaimDeniedFailedPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandleClaimDeniedFailedPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
