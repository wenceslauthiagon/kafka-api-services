import { RedisKey, RedisService } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  Provider,
  RemittanceOrderCurrentGroup,
  RemittanceOrderCurrentGroupRepository,
  SettlementDateCode,
  System,
} from '@zro/otc/domain';
import { RemittanceOrderCurrentGroupModel } from '@zro/otc/infrastructure';

const PREFIX = 'remittance_order_current_group';

export class RemittanceOrderCurrentGroupRedisRepository
  implements RemittanceOrderCurrentGroupRepository
{
  constructor(private redisService: RedisService) {}

  static toDomain(
    group: RedisKey<RemittanceOrderCurrentGroupModel>,
  ): RemittanceOrderCurrentGroup {
    return (
      group?.data && new RemittanceOrderCurrentGroupModel(group.data).toDomain()
    );
  }

  async createOrUpdate(
    remittanceOrderCurrentGroup: RemittanceOrderCurrentGroup,
  ): Promise<void> {
    const result: RedisKey<RemittanceOrderCurrentGroupModel> = {
      key: `${PREFIX}:currency_id:${remittanceOrderCurrentGroup.currency.id}:system_id:${remittanceOrderCurrentGroup.system.id}:provider_id:${remittanceOrderCurrentGroup.provider.id}:send_date:${remittanceOrderCurrentGroup.sendDateCode}:receive_date:${remittanceOrderCurrentGroup.receiveDateCode}`,
      data: new RemittanceOrderCurrentGroupModel(remittanceOrderCurrentGroup),
    };

    await this.redisService.set<RemittanceOrderCurrentGroupModel>(result);
  }

  async getByCurrencySystemProviderSendDateCodeAndReceiveDateCode(
    currency: Currency,
    system: System,
    provider: Provider,
    sendDateCode: SettlementDateCode,
    receiveDateCode: SettlementDateCode,
  ): Promise<RemittanceOrderCurrentGroup> {
    return this.redisService
      .get<RemittanceOrderCurrentGroupModel>(
        `${PREFIX}:currency_id:${currency.id}:system_id:${system.id}:provider_id:${provider.id}:send_date:${sendDateCode}:receive_date:${receiveDateCode}`,
      )
      .then(RemittanceOrderCurrentGroupRedisRepository.toDomain);
  }
}
