import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { Quotation, QuotationRepository } from '@zro/quotations/domain';
import { QuotationModel } from '@zro/quotations/infrastructure';

export class QuotationDatabaseRepository
  extends DatabaseRepository
  implements QuotationRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(model: QuotationModel): Quotation {
    return model?.toDomain() ?? null;
  }

  async create(quotation: Quotation): Promise<Quotation> {
    const createdQuotation = await QuotationModel.create<QuotationModel>(
      quotation,
      { transaction: this.transaction },
    );

    quotation.id = createdQuotation.id;
    quotation.createdAt = createdQuotation.createdAt;

    return quotation;
  }

  async update(quotation: Quotation): Promise<Quotation> {
    await QuotationModel.update<QuotationModel>(quotation, {
      where: { id: quotation.id },
      transaction: this.transaction,
    });

    return quotation;
  }

  async getById(id: string): Promise<Quotation> {
    return QuotationModel.findOne<QuotationModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(QuotationDatabaseRepository.toDomain);
  }
}
