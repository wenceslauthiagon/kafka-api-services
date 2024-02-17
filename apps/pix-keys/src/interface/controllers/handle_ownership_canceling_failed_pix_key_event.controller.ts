import { Logger } from 'winston';
import {
  PixKeyEvent,
  HandleOwnershipCancelingFailedPixKeyEventUseCase as UseCase,
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

export type HandleOwnershipCancelingFailedPixKeyEventRequest = PixKeyEvent;

export interface HandleOwnershipCancelingFailedPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandleOwnershipCancelingFailedPixKeyEventController {
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
      context: HandleOwnershipCancelingFailedPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: HandleOwnershipCancelingFailedPixKeyEventRequest,
  ): Promise<HandleOwnershipCancelingFailedPixKeyEventResponse> {
    this.logger.debug('Handle ownership canceling failed event by Pix ID.', {
      request,
    });
    const { id } = request;

    const pixKey = await this.usecase.execute(id);

    return handleOwnershipCancelingFailedPixKeyEventPresenter(pixKey);
  }
}

export function handleOwnershipCancelingFailedPixKeyEventPresenter(
  pixKey: PixKey,
): HandleOwnershipCancelingFailedPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandleOwnershipCancelingFailedPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
