import { User } from '@zro/users/domain';
import { OrderSide } from '@zro/otc/domain';
import { Currency } from '@zro/operations/domain';
import { Quotation, StreamQuotation, Holiday } from '@zro/quotations/domain';

export interface QuotationService {
  /**
   * Call quotation for create quotation from stream redis.
   * @param quotation The quotation.
   */
  createQuotation(quotation: Quotation): Promise<void>;

  /**
   * Call quotation for get quotation from stream redis.
   * @param user Quotation user
   * @param baseCurrency Quotation base currency
   * @param amountCurrency Quotation amount currency
   * @param amount Quotation amount
   * @param side Quotation side
   * @returns Quotation if found or null otherwise.
   */
  getQuotation(
    user: User,
    baseCurrency: Currency,
    amountCurrency: Currency,
    amount: number,
    side: OrderSide,
  ): Promise<Quotation>;

  /**
   * Call quotation for getting quotation from stream redis.
   * @param quotation The quotation.
   * @returns Quotation if found or null otherwise.
   */
  getCurrentQuotationById(quotation: Quotation): Promise<Quotation>;

  /**
   * Call quotation for getting quotation.
   * @param quotation The quotation.
   * @returns Quotation if found or null otherwise.
   */
  getQuotationById(quotation: Quotation): Promise<Quotation>;

  /**
   * Call stream quotation for get one from stream redis.
   * @param baseCurrency Quotation currency
   * @returns Quotation if found or null otherwise.
   */
  getStreamQuotationByBaseCurrency(
    baseCurrency: Currency,
  ): Promise<StreamQuotation>;

  /**
   * Call Holiday for get one by date.
   * @param date Holiday date
   * @returns Holiday if found or null otherwise.
   */
  getHolidayByDate(date: Date): Promise<Holiday>;
}
