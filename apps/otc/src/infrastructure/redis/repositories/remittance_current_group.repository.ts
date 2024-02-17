import { RedisKey, RedisService } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  Provider,
  RemittanceCurrentGroup,
  RemittanceCurrentGroupRepository,
  SettlementDateCode,
  System,
} from '@zro/otc/domain';
import { RemittanceCurrentGroupModel } from '@zro/otc/infrastructure';

const PREFIX = 'remittance_current_group';

export class RemittanceCurrentGroupRedisRepository
  implements RemittanceCurrentGroupRepository
{
  constructor(private redisService: RedisService) {}

  static toDomain(
    page: RedisKey<RemittanceCurrentGroupModel>,
  ): RemittanceCurrentGroup {
    return page?.data && new RemittanceCurrentGroupModel(page.data).toDomain();
  }

  async createOrUpdate(
    remittanceCurrentGroup: RemittanceCurrentGroup,
  ): Promise<void> {
    const result: RedisKey<RemittanceCurrentGroupModel> = {
      key: `${PREFIX}:currency_id:${remittanceCurrentGroup.currency.id}:system_id:${remittanceCurrentGroup.system.id}:provider_id:${remittanceCurrentGroup.provider.id}:send_date:${remittanceCurrentGroup.sendDateCode}:receive_date:${remittanceCurrentGroup.receiveDateCode}`,
      data: new RemittanceCurrentGroupModel(remittanceCurrentGroup),
    };

    await this.redisService.set<RemittanceCurrentGroupModel>(result);
  }

  async getByCurrencySystemProviderSendDateCodeAndReceiveDateCode(
    currency: Currency,
    system: System,
    provider: Provider,
    sendDateCode: SettlementDateCode,
    receiveDateCode: SettlementDateCode,
  ): Promise<RemittanceCurrentGroup> {
    return this.redisService
      .get<RemittanceCurrentGroupModel>(
        `${PREFIX}:currency_id:${currency.id}:system_id:${system.id}:provider_id:${provider.id}:send_date:${sendDateCode}:receive_date:${receiveDateCode}`,
      )
      .then(RemittanceCurrentGroupRedisRepository.toDomain);
  }
}
