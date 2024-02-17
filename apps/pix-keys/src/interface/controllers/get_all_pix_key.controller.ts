import { Logger } from 'winston';
import { Pagination, TPaginationResponse, PaginationEntity } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  KeyState,
  KeyType,
  PixKey,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import { GetAllPixKeyUseCase as UseCase } from '@zro/pix-keys/application';

export enum GetAllPixKeyRequestSort {
  ID = 'id',
  CREATED_AT = 'created_at',
}

export type GetAllPixKeyRequest = Pagination & {
  userId?: string;
};

export interface GetAllPixKeyResponseItem {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export type GetAllPixKeyResponse =
  TPaginationResponse<GetAllPixKeyResponseItem>;

function getAllPixKeyPresenter(pixKeys: PixKey[]): GetAllPixKeyResponseItem[] {
  if (!pixKeys) return null;

  const response = pixKeys.map<GetAllPixKeyResponseItem>((pixKey) => ({
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  }));

  return response;
}

export class GetAllPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
  ) {
    this.logger = logger.child({
      context: GetAllPixKeyController.name,
    });
    this.usecase = new UseCase(this.logger, pixKeyRepository);
  }

  async execute(request: GetAllPixKeyRequest): Promise<GetAllPixKeyResponse> {
    const { order, page, pageSize, sort, userId } = request;
    this.logger.debug('Get all Pix keys.', { request });

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const user = userId && new UserEntity({ uuid: userId });

    const results = await this.usecase.execute(pagination, user);

    return {
      ...results,
      data: getAllPixKeyPresenter(results.data),
    };
  }
}
