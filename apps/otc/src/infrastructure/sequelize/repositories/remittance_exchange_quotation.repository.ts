import { DatabaseRepository } from '@zro/common';
import {
  RemittanceExchangeQuotation,
  RemittanceExchangeQuotationRepository,
  Remittance,
  ExchangeQuotation,
} from '@zro/otc/domain';
import {
  ExchangeQuotationModel,
  RemittanceExchangeQuotationModel,
} from '@zro/otc/infrastructure';

export class RemittanceExchangeQuotationDatabaseRepository
  extends DatabaseRepository
  implements RemittanceExchangeQuotationRepository
{
  static toDomain(
    model: RemittanceExchangeQuotationModel,
  ): RemittanceExchangeQuotation {
    return model?.toDomain() ?? null;
  }

  async create(
    remittanceExchangeQuotation: RemittanceExchangeQuotation,
  ): Promise<RemittanceExchangeQuotation> {
    const createdRemittanceExchangeQuotation =
      await RemittanceExchangeQuotationModel.create<RemittanceExchangeQuotationModel>(
        remittanceExchangeQuotation,
        {
          transaction: this.transaction,
        },
      );

    remittanceExchangeQuotation.createdAt =
      createdRemittanceExchangeQuotation.createdAt;
    return remittanceExchangeQuotation;
  }

  async update(
    remittanceExchangeQuotation: RemittanceExchangeQuotation,
  ): Promise<RemittanceExchangeQuotation> {
    await RemittanceExchangeQuotationModel.update<RemittanceExchangeQuotationModel>(
      remittanceExchangeQuotation,
      {
        where: { id: remittanceExchangeQuotation.id },
        transaction: this.transaction,
      },
    );

    return remittanceExchangeQuotation;
  }

  async getByRemittanceAndExchangeQuotation(
    remittance: Remittance,
    exchangeQuotation: ExchangeQuotation,
  ): Promise<RemittanceExchangeQuotation> {
    return RemittanceExchangeQuotationModel.findOne<RemittanceExchangeQuotationModel>(
      {
        where: {
          remittanceId: remittance.id,
          exchangeQuotationId: exchangeQuotation.id,
        },
        transaction: this.transaction,
      },
    ).then(RemittanceExchangeQuotationDatabaseRepository.toDomain);
  }

  async getAllByRemittance(
    remittance: Remittance,
  ): Promise<RemittanceExchangeQuotation[]> {
    return RemittanceExchangeQuotationModel.findAll<RemittanceExchangeQuotationModel>(
      {
        where: { remittanceId: remittance.id },
        include: {
          model: ExchangeQuotationModel,
        },
        transaction: this.transaction,
      },
    ).then((res) =>
      res.map(RemittanceExchangeQuotationDatabaseRepository.toDomain),
    );
  }

  async getAllByExchangeQuotation(
    exchangeQuotation: ExchangeQuotation,
  ): Promise<RemittanceExchangeQuotation[]> {
    return RemittanceExchangeQuotationModel.findAll<RemittanceExchangeQuotationModel>(
      {
        where: { exchangeQuotationId: exchangeQuotation.id },
        transaction: this.transaction,
      },
    ).then((res) =>
      res.map(RemittanceExchangeQuotationDatabaseRepository.toDomain),
    );
  }
}
