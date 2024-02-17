import { Logger } from 'winston';
import {
  HandleDeletingPixKeyEventUseCase as UseCase,
  PixKeyGateway,
  PixKeyEvent,
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

export type HandleDeletingPixKeyEventRequest = PixKeyEvent;

export interface HandleDeletingPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandleDeletingPixKeyEventController {
  /**
   * Handler triggered when key was added successfully to DICT.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter PixKey event emitter.
   * @param pspGateway PixKey psp gateway.
   * @param logger Global logger.
   */
  constructor(
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    pspGateway: PixKeyGateway,
    private logger: Logger,
    ispb: string,
  ) {
    this.logger = logger.child({
      context: HandleDeletingPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      eventEmitter,
      pspGateway,
      ispb,
    );
  }

  async execute(
    request: HandleDeletingPixKeyEventRequest,
  ): Promise<HandleDeletingPixKeyEventResponse> {
    const { id } = request;
    this.logger.debug('Handle deleted event by Pix ID.', { request });

    const pixKey = await this.usecase.execute(id);

    return handleDeletingPixKeyEventPresenter(pixKey);
  }
}

function handleDeletingPixKeyEventPresenter(
  pixKey: PixKey,
): HandleDeletingPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandleDeletingPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
