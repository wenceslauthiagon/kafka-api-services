import { Logger } from 'winston';
import { Pagination, PaginationEntity, TPaginationResponse } from '@zro/common';
import {
  KeyState,
  GetPixKeyHistoryFilter,
  PixKeyHistory,
  PixKeyHistoryRepository,
  KeyType,
  GetPixKeyFilter,
} from '@zro/pix-keys/domain';
import { GetHistoryPixKeyUseCase as UseCase } from '@zro/pix-keys/application';

export enum GetHistoryPixKeyRequestSort {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}

export type GetHistoryPixKeyRequestFilter = GetPixKeyHistoryFilter;

export interface GetHistoryPixKeyResponseItem {
  id: string;
  pixKeyId: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export type GetHistoryPixKeyResponse =
  TPaginationResponse<GetHistoryPixKeyResponseItem>;

export type GetHistoryPixKeyRequest = Pagination &
  GetHistoryPixKeyRequestFilter;

function getHistoryPixKeyPresenter(
  pixHistoryKeys: PixKeyHistory[],
): GetHistoryPixKeyResponseItem[] {
  if (!pixHistoryKeys) return null;

  const response = pixHistoryKeys.map<GetHistoryPixKeyResponseItem>(
    (pixHistoryKey) => ({
      id: pixHistoryKey.id,
      pixKeyId: pixHistoryKey.pixKey.id,
      key: pixHistoryKey.pixKey.key,
      type: pixHistoryKey.pixKey.type,
      state: pixHistoryKey.state,
      createdAt: pixHistoryKey.createdAt,
      updatedAt: pixHistoryKey.updatedAt,
      userId: pixHistoryKey.user.uuid,
    }),
  );

  return response;
}

export class GetHistoryPixKeyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyHistoryRepository: PixKeyHistoryRepository,
  ) {
    this.logger = logger.child({ context: GetHistoryPixKeyController.name });
    this.usecase = new UseCase(this.logger, pixKeyHistoryRepository);
  }

  async execute(
    request: GetHistoryPixKeyRequest,
  ): Promise<GetHistoryPixKeyResponse> {
    this.logger.debug('Get histories request.', { request });

    const {
      order,
      page,
      pageSize,
      sort,
      pixKeyId,
      pixKey,
      state,
      createdAt,
      updatedAt,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const filter: GetPixKeyHistoryFilter = JSON.parse(
      JSON.stringify({ pixKeyId, state, createdAt, updatedAt }),
    );
    const filterPixKey: GetPixKeyFilter = JSON.parse(
      JSON.stringify({ ...pixKey }),
    );

    const pixHistoryKeys = await this.usecase.execute(
      pagination,
      filter,
      filterPixKey,
    );

    return {
      ...pixHistoryKeys,
      data: getHistoryPixKeyPresenter(pixHistoryKeys.data),
    };
  }
}
