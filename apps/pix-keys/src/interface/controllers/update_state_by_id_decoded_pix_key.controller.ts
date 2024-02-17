import { Logger } from 'winston';
import { User, PersonType } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';
import {
  DecodedPixKey,
  DecodedPixKeyRepository,
  DecodedPixKeyState,
  KeyType,
} from '@zro/pix-keys/domain';
import { UpdateStateByIdDecodedPixKeyUseCase as UseCase } from '@zro/pix-keys/application';
import {
  DecodedPixKeyEventEmitterController,
  DecodedPixKeyEventEmitterControllerInterface,
} from '../events/decoded_pix_key.emitter';

export interface UpdateStateByIdDecodedPixKeyRequest {
  id: string;
  state: DecodedPixKeyState;
}

export interface UpdateStateByIdDecodedPixKeyResponse {
  type: KeyType;
  key: string;
  personType: PersonType;
  document: string;
  name: string;
  tradeName?: string;
  accountNumber: string;
  accountType: AccountType;
  branch: string;
  ispb: string;
  activeAccount: boolean;
  accountOpeningDate: Date;
  keyCreationDate: Date;
  keyOwnershipDate?: Date;
  claimRequestDate?: Date;
  endToEndId?: string;
  cidId?: string;
  dictAccountId?: number;
  state: DecodedPixKeyState;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

function updateStateByIdDecodedPixKeyPresenter(
  decodedPixKey: DecodedPixKey,
): UpdateStateByIdDecodedPixKeyResponse {
  if (!decodedPixKey) return null;

  const response: UpdateStateByIdDecodedPixKeyResponse = {
    type: decodedPixKey.type,
    key: decodedPixKey.key,
    personType: decodedPixKey.personType,
    document: decodedPixKey.document,
    name: decodedPixKey.name,
    tradeName: decodedPixKey.tradeName,
    accountNumber: decodedPixKey.accountNumber,
    accountType: decodedPixKey.accountType,
    branch: decodedPixKey.branch,
    ispb: decodedPixKey.ispb,
    activeAccount: decodedPixKey.activeAccount,
    accountOpeningDate: decodedPixKey.accountOpeningDate,
    keyCreationDate: decodedPixKey.keyCreationDate,
    keyOwnershipDate: decodedPixKey.keyOwnershipDate,
    claimRequestDate: decodedPixKey.claimRequestDate,
    endToEndId: decodedPixKey.endToEndId,
    cidId: decodedPixKey.cidId,
    dictAccountId: decodedPixKey.dictAccountId,
    state: decodedPixKey.state,
    user: decodedPixKey.user,
    createdAt: decodedPixKey.createdAt,
    updatedAt: decodedPixKey.updatedAt,
  };

  return response;
}

export class UpdateStateByIdDecodedPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    decodedPixKeyRepository: DecodedPixKeyRepository,
    decodedPixKeyEmitter: DecodedPixKeyEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: UpdateStateByIdDecodedPixKeyController.name,
    });

    const eventEmitter = new DecodedPixKeyEventEmitterController(
      decodedPixKeyEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      decodedPixKeyRepository,
      eventEmitter,
    );
  }

  async execute(
    request: UpdateStateByIdDecodedPixKeyRequest,
  ): Promise<UpdateStateByIdDecodedPixKeyResponse> {
    const { id, state } = request;
    this.logger.debug('Update state by Pix ID decoded pix key.', { request });

    const decodedPixKey = await this.usecase.execute(id, state);

    return updateStateByIdDecodedPixKeyPresenter(decodedPixKey);
  }
}
