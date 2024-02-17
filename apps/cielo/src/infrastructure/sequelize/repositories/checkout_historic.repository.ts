import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import {
  CheckoutHistoric,
  CheckoutHistoricRepository,
} from '@zro/cielo/domain';
import { CheckoutHistoricModel } from '../models/checkout_historic.model';

@Injectable()
export class CheckoutHistoricDatabaseRepository
  extends DatabaseRepository
  implements CheckoutHistoricRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  async findByCheckoutId(checkoutId: string): Promise<CheckoutHistoricModel[]> {
    return CheckoutHistoricModel.findAll({
      where: { checkoutId },
      transaction: this.transaction,
    });
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
}
