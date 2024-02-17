import { CryptoReport, CryptoReportType } from '@zro/otc/domain';
import { CryptoTransactionsNotFoundException } from '@zro/otc/application';
import { formatValueFromFloatToInt, getMoment } from '@zro/common';

export type CryptoReportRow = Pick<
  CryptoReport,
  | 'createdAt'
  | 'type'
  | 'crypto'
  | 'cryptoAmount'
  | 'cryptoPrice'
  | 'fiatAmount'
  | 'avgPrice'
  | 'cryptoBalance'
  | 'profit'
  | 'loss'
  | 'profitLossPercentage'
  | 'accuratePrice'
>;

// Based on buy and deposit operations
export interface CryptoReportResultRow {
  createdAt?: Date;
  fiatAmountSalesTotal: number;
  profitTotal: number;
  lossTotal: number;
  profitLossPercentageTotal: number;
}

function isTypeBeneficiary(type: CryptoReportType): boolean {
  return [
    CryptoReportType.BUY,
    CryptoReportType.DEPOSIT,
    CryptoReportType.CASHBACK,
  ].includes(type);
}

export const generateCryptoReportResults = async function (
  transactions: CryptoReportRow[],
): Promise<CryptoReportResultRow[]> {
  if (!transactions.length) {
    throw new CryptoTransactionsNotFoundException();
  }

  let arrayPosition = 0;

  const firstTransaction = transactions[0];

  const cryptoReportResults: CryptoReportResultRow[] = [
    {
      createdAt: firstTransaction.createdAt,
      fiatAmountSalesTotal: isTypeBeneficiary(firstTransaction.type)
        ? 0
        : firstTransaction.fiatAmount,
      profitTotal: firstTransaction.profit,
      lossTotal: firstTransaction.loss,
      profitLossPercentageTotal:
        transactions[arrayPosition].profit !== 0 &&
        transactions[arrayPosition].loss !== 0
          ? formatValueFromFloatToInt(
              (transactions[arrayPosition].profit /
                transactions[arrayPosition].loss) *
                100,
              2,
            )
          : 0,
    },
  ];

  const firstCryptoReportResult = cryptoReportResults[0];

  const total: CryptoReportResultRow = {
    fiatAmountSalesTotal: firstCryptoReportResult.fiatAmountSalesTotal,
    profitTotal: firstCryptoReportResult.profitTotal,
    lossTotal: firstCryptoReportResult.lossTotal,
    profitLossPercentageTotal:
      firstCryptoReportResult.profitLossPercentageTotal,
  };

  if (transactions.length > 1) {
    for (let i = 1; i < transactions.length; i++) {
      const actualTransaction = transactions[i];
      const actualMonth = getMoment(actualTransaction.createdAt).month() + 1;
      const actualYear = getMoment(actualTransaction.createdAt).year();

      const lastCryptoReportResult = cryptoReportResults[arrayPosition];
      const lastMonth = getMoment(lastCryptoReportResult.createdAt).month() + 1;
      const lastYear = getMoment(lastCryptoReportResult.createdAt).year();

      if (actualMonth === lastMonth && actualYear === lastYear) {
        isTypeBeneficiary(actualTransaction.type)
          ? (lastCryptoReportResult.fiatAmountSalesTotal += 0)
          : (lastCryptoReportResult.fiatAmountSalesTotal +=
              actualTransaction.fiatAmount);

        lastCryptoReportResult.profitTotal += actualTransaction.profit;
        lastCryptoReportResult.lossTotal += actualTransaction.loss;
        lastCryptoReportResult.profitLossPercentageTotal =
          lastCryptoReportResult.profitTotal !== 0 &&
          lastCryptoReportResult.lossTotal !== 0
            ? formatValueFromFloatToInt(
                (lastCryptoReportResult.profitTotal /
                  lastCryptoReportResult.lossTotal) *
                  100,
                2,
              )
            : 0;
      } else {
        arrayPosition++;

        const fiatAmountSalesTotal = isTypeBeneficiary(actualTransaction.type)
          ? 0
          : actualTransaction.fiatAmount;

        cryptoReportResults.push({
          createdAt: actualTransaction.createdAt,
          fiatAmountSalesTotal,
          profitTotal: actualTransaction.profit,
          lossTotal: actualTransaction.loss,
          profitLossPercentageTotal:
            actualTransaction.profit !== 0 && actualTransaction.loss !== 0
              ? formatValueFromFloatToInt(
                  (actualTransaction.profit / actualTransaction.loss) * 100,
                  2,
                )
              : 0,
        });
      }

      total.fiatAmountSalesTotal += isTypeBeneficiary(actualTransaction.type)
        ? 0
        : actualTransaction.fiatAmount;
      total.profitTotal += actualTransaction.profit;
      total.lossTotal += actualTransaction.loss;
      total.profitLossPercentageTotal =
        total.profitTotal !== 0 && total.lossTotal !== 0
          ? formatValueFromFloatToInt(
              (total.profitTotal / total.lossTotal) * 100,
              2,
            )
          : 0;
    }
  }

  cryptoReportResults.push(total);

  return cryptoReportResults;
};
