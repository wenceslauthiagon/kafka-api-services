import { RedisKey, RedisService } from '@zro/common';
import {
  PixStatementCurrentPage,
  PixStatementCurrentPageRepository,
} from '@zro/api-topazio/domain';
import { PixStatementCurrentPageModel } from '@zro/api-topazio/infrastructure';

const PREFIX = 'pix_statement_current_pages';

export class PixStatementCurrentPageRedisRepository
  implements PixStatementCurrentPageRepository
{
  constructor(private redisService: RedisService) {}

  static toDomain(page: RedisKey<PixStatementCurrentPageModel>) {
    return page?.data && new PixStatementCurrentPageModel(page.data).toDomain();
  }

  async createOrUpdate(
    pixStatementCurrentPage: PixStatementCurrentPage,
  ): Promise<void> {
    const result: RedisKey<PixStatementCurrentPageModel> = {
      key: `${PREFIX}`,
      data: new PixStatementCurrentPageModel(pixStatementCurrentPage),
    };

    await this.redisService.set<PixStatementCurrentPageModel>(result);
  }

  async getCurrentPage(): Promise<PixStatementCurrentPage> {
    const result = await this.redisService
      .get<PixStatementCurrentPageModel>(`${PREFIX}`)
      .then(PixStatementCurrentPageRedisRepository.toDomain);

    return result;
  }
}
