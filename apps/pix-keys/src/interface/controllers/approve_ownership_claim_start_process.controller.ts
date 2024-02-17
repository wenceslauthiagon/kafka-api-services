import { Logger } from 'winston';
import { UserEntity } from '@zro/users/domain';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
} from '@zro/pix-keys/domain';
import { ApproveOwnershipClaimStartProcessUseCase as UseCase } from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export interface ApproveOwnershipClaimStartProcessRequest {
  userId: string;
  id: string;
}

export interface ApproveOwnershipClaimStartProcessResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

function approveOwnershipClaimStartProcessPresenter(
  pixKey: PixKey,
): ApproveOwnershipClaimStartProcessResponse {
  if (!pixKey) return null;

  const response: ApproveOwnershipClaimStartProcessResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}

export class ApproveOwnershipClaimStartProcessController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: ApproveOwnershipClaimStartProcessController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, pixKeyRepository, eventEmitter);
  }

  async execute(
    request: ApproveOwnershipClaimStartProcessRequest,
  ): Promise<ApproveOwnershipClaimStartProcessResponse> {
    const { userId, id } = request;
    this.logger.debug('Start ownership process.', { request });

    const user = new UserEntity({ uuid: userId });

    const pixKey = await this.usecase.execute(user, id);

    return approveOwnershipClaimStartProcessPresenter(pixKey);
  }
}
