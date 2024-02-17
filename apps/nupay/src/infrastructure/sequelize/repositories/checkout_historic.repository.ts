import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { CheckoutModel } from '../models/checkout.model';
import { CheckoutHistoricModel } from '../models/checkout_historic.model';
import { DatabaseRepository } from '@zro/common';
import { Checkout } from '@zro/nupay/domain/entities/checkout.entity';
import { CheckoutHistoricRepository } from '@zro/nupay/domain/repositories/checkout_historic.repository';
import { CheckoutHistoric } from '@zro/nupay/domain/entities/checkout_historic.entity';

@Injectable()
export class CheckoutHistoricDatabaseRepository
  extends DatabaseRepository
  implements CheckoutHistoricRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(checkout: CheckoutModel): Checkout {
    return checkout?.toDomain() ?? null;
  }

  async create(checkoutHistoric: CheckoutHistoric): Promise<CheckoutHistoric> {
    const createdCheckoutHistoric =
      await CheckoutHistoricModel.create<CheckoutHistoricModel>(
        checkoutHistoric,
        {
          transaction: this.transaction,
        },
      );

    checkoutHistoric.createdAt = createdCheckoutHistoric.createdAt;

    return checkoutHistoric;
  }

  async findByCheckoutId(checkoutId: string): Promise<CheckoutHistoricModel[]> {
    return CheckoutHistoricModel.findAll({
      where: { checkoutId },
      transaction: this.transaction,
    });
  }
}
