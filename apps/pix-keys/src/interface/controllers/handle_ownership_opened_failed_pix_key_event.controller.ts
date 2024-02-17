import { Logger } from 'winston';
import {
  PixKeyEvent,
  HandleOwnershipOpenedFailedPixKeyEventUseCase as UseCase,
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

export type HandleOwnershipOpenedFailedPixKeyEventRequest = PixKeyEvent;

export interface HandleOwnershipOpenedFailedPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandleOwnershipOpenedFailedPixKeyEventController {
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
      context: HandleOwnershipOpenedFailedPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: HandleOwnershipOpenedFailedPixKeyEventRequest,
  ): Promise<HandleOwnershipOpenedFailedPixKeyEventResponse> {
    const { id } = request;
    this.logger.debug('Handle ownership opened failed event by Pix ID.', {
      request,
    });

    const pixKey = await this.usecase.execute(id);

    return handleOwnershipOpenedFailedPixKeyEventPresenter(pixKey);
  }
}

export function handleOwnershipOpenedFailedPixKeyEventPresenter(
  pixKey: PixKey,
): HandleOwnershipOpenedFailedPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandleOwnershipOpenedFailedPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
