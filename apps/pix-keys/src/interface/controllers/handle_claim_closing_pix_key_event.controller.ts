import { Logger } from 'winston';
import {
  HandleClaimClosingPixKeyEventUseCase as UseCase,
  PixKeyGateway,
  PixKeyReasonEvent,
} from '@zro/pix-keys/application';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export type HandleClaimClosingPixKeyEventRequest = PixKeyReasonEvent;

export interface HandleClaimClosingPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandleClaimClosingPixKeyEventController {
  /**
   * Handler triggered when key was sent successfully to DICT.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter PiKey Event Emitter
   * @param pspGateway PixKey psp gateway.
   * @param logger Global logger.
   * @param ispb ispb
   * @param pixKeyClaimRepository Pix key claims repository.
   */
  constructor(
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    pspGateway: PixKeyGateway,
    private logger: Logger,
    ispb: string,
    pixKeyClaimRepository: PixKeyClaimRepository,
  ) {
    this.logger = logger.child({
      context: HandleClaimClosingPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      eventEmitter,
      pspGateway,
      ispb,
      pixKeyClaimRepository,
    );
  }

  async execute(
    request: HandleClaimClosingPixKeyEventRequest,
  ): Promise<HandleClaimClosingPixKeyEventResponse> {
    const { id, reason } = request;
    this.logger.debug('Handle claim closing event by Pix ID.', {
      request,
    });

    const pixKey = await this.usecase.execute(id, reason);

    return handleClaimClosingPixKeyEventPresenter(pixKey);
  }
}

function handleClaimClosingPixKeyEventPresenter(
  pixKey: PixKey,
): HandleClaimClosingPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandleClaimClosingPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
