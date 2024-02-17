import { Logger } from 'winston';
import {
  HandleClaimDeniedPixKeyEventUseCase as UseCase,
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

export type HandleClaimDeniedPixKeyEventRequest = PixKeyReasonEvent;

export interface HandleClaimDeniedPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandleClaimDeniedPixKeyEventController {
  /**
   * Handler triggered when key was sent successfully to DICT.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter PixKey event emitter.
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
      context: HandleClaimDeniedPixKeyEventController.name,
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
    request: HandleClaimDeniedPixKeyEventRequest,
  ): Promise<HandleClaimDeniedPixKeyEventResponse> {
    const { id, reason } = request;
    this.logger.debug('Handle claim denied event by Pix ID.', {
      request,
    });

    const pixKey = await this.usecase.execute(id, reason);

    return handleClaimDeniedPixKeyEventPresenter(pixKey);
  }
}

function handleClaimDeniedPixKeyEventPresenter(
  pixKey: PixKey,
): HandleClaimDeniedPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandleClaimDeniedPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
