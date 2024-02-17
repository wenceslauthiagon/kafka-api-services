import { Logger } from 'winston';
import { UserEntity } from '@zro/users/domain';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
} from '@zro/pix-keys/domain';
import { ApprovePortabilityClaimStartProcessUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface ApprovePortabilityClaimStartProcessRequest {
  userId: string;
  id: string;
}

export interface ApprovePortabilityClaimStartProcessResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function approvePortabilityClaimStartProcessPresenter(
  pixKey: PixKey,
): ApprovePortabilityClaimStartProcessResponse {
  if (!pixKey) return null;

  const response: ApprovePortabilityClaimStartProcessResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class ApprovePortabilityClaimStartProcessController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: ApprovePortabilityClaimStartProcessController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: ApprovePortabilityClaimStartProcessRequest,
  ): Promise<ApprovePortabilityClaimStartProcessResponse> {
    const { userId, id } = request;
    this.logger.debug('Start portability process.', { request });

    const user = new UserEntity({ uuid: userId });

    const pixKey = await this.usecase.execute(user, id);

    return approvePortabilityClaimStartProcessPresenter(pixKey);
  }
}
