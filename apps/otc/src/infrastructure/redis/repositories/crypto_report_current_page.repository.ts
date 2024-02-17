import { RedisKey, RedisService } from '@zro/common';
import {
  CryptoReportCurrentPage,
  CryptoReportCurrentPageRepository,
} from '@zro/otc/domain';
import { CryptoReportCurrentPageModel } from '@zro/otc/infrastructure';

const PREFIX = 'crypto_report_current_page';

export class CryptoReportCurrentPageRedisRepository
  implements CryptoReportCurrentPageRepository
{
  constructor(private redisService: RedisService) {}

  static toDomain(
    page: RedisKey<CryptoReportCurrentPageModel>,
  ): CryptoReportCurrentPage {
    return page?.data && new CryptoReportCurrentPageModel(page.data).toDomain();
  }

  async createOrUpdate(
    cryptoReportCurrentPage: CryptoReportCurrentPage,
  ): Promise<void> {
    const result: RedisKey<CryptoReportCurrentPageModel> = {
      key: `${PREFIX}`,
      data: new CryptoReportCurrentPageModel(cryptoReportCurrentPage),
    };

    await this.redisService.set<CryptoReportCurrentPageModel>(result);
  }

  async getCurrentPage(): Promise<CryptoReportCurrentPage> {
    const result = await this.redisService
      .get<CryptoReportCurrentPageModel>(`${PREFIX}`)
      .then(CryptoReportCurrentPageRedisRepository.toDomain);

    return result;
  }
}
