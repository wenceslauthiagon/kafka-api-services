import { Logger } from 'winston';
import { User, PersonType } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';
import {
  DecodedPixKey,
  DecodedPixKeyRepository,
  DecodedPixKeyState,
  KeyType,
} from '@zro/pix-keys/domain';
import { GetByIdDecodedPixKeyUseCase as UseCase } from '@zro/pix-keys/application';

export interface GetByIdDecodedPixKeyRequest {
  id: string;
}

export interface GetByIdDecodedPixKeyResponse {
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

function getByIdDecodedPixKeyPresenter(
  decodedPixKey: DecodedPixKey,
): GetByIdDecodedPixKeyResponse {
  if (!decodedPixKey) return null;

  const response: GetByIdDecodedPixKeyResponse = {
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

export class GetByIdDecodedPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    decodedPixKeyRepository: DecodedPixKeyRepository,
  ) {
    this.logger = logger.child({
      context: GetByIdDecodedPixKeyController.name,
    });
    this.usecase = new UseCase(this.logger, decodedPixKeyRepository);
  }

  async execute(
    request: GetByIdDecodedPixKeyRequest,
  ): Promise<GetByIdDecodedPixKeyResponse> {
    const { id } = request;
    this.logger.debug('Get by Pix ID decoded pix key.', { request });

    const decodedPixKey = await this.usecase.execute(id);

    return getByIdDecodedPixKeyPresenter(decodedPixKey);
  }
}
