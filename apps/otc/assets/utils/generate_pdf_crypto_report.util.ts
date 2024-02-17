import * as fs from 'fs';
import * as PDFDocument from 'pdfkit';
import {
  CryptoReportResultRow,
  CryptoReportRow,
  cryptoReportProperties,
  translateCryptoReportType,
} from '@zro/assets/otc';
import axios from 'axios';
import { Currency } from '@zro/operations/domain';
import {
  formatValueFromFloatToPtBrlString,
  formatFullName,
  formatValueFromIntToFloat,
  getMoment,
} from '@zro/common';

type CryptoReportTable = {
  headers: string[];
  rows: any[];
};

export class GeneratePdfCryptoReport {
  private doc: typeof PDFDocument;
  private fileName: string;
  private transactions: CryptoReportRow[];
  private userName: string;
  private userDocument: string;
  private coin: Currency;
  private createdAtStartDate: string;
  private createdAtEndDate: string;
  private cryptoReportResults: CryptoReportResultRow[];
  private emittedAt: string;
  private zrobankLogoUrl: string;

  private readonly ROW_LINE_SPACING = 0.3;
  private readonly HEADER_LINE_SPACING = 0.5;
  private readonly COLUMN_AND_ROW_SPACING = 5;
  private readonly LINE_WIDTH = 0.5;
  private readonly BRL_DECIMAL = 2;
  private readonly NAME_MAX_LENGTH = 50;
  private readonly CLIENT_MENU_X_POSITION = 380;
  private readonly CLIENT_MENU_DATA_X_POSITION = 430;

  constructor(
    _fileName: string,
    _transactions: CryptoReportRow[],
    _userName: string,
    _userDocument: string,
    _coin: Currency,
    _createdAtStartDate: Date,
    _createdAtEndDate: Date,
    _cryptoReportResults: CryptoReportResultRow[],
    _zrobankLogoUrl: string,
  ) {
    this.doc = new PDFDocument({ compress: false });
    this.fileName = _fileName;
    this.transactions = _transactions;
    this.userName = formatFullName(_userName);
    this.userDocument = _userDocument;
    this.coin = _coin;
    this.createdAtStartDate = _createdAtStartDate.toLocaleDateString('pt-BR');
    this.createdAtEndDate = _createdAtEndDate.toLocaleDateString('pt-BR');
    this.cryptoReportResults = _cryptoReportResults;
    this.emittedAt = getMoment().toDate().toLocaleDateString('pt-BR');
    this.zrobankLogoUrl = _zrobankLogoUrl;
  }

  async execute(): Promise<void> {
    await this.createPageHeader();

    // Create the transactions table
    const transactionsTable: CryptoReportTable = {
      headers: cryptoReportProperties.transactionsTableHeader,
      rows: [],
    };

    // Add the transactions to the table
    for (const transaction of this.transactions) {
      const cryptoPrice = transaction.accuratePrice
        ? `${formatValueFromFloatToPtBrlString(
            formatValueFromIntToFloat(
              transaction.cryptoPrice,
              this.BRL_DECIMAL,
            ),
          )}`
        : `${formatValueFromFloatToPtBrlString(
            formatValueFromIntToFloat(
              transaction.cryptoPrice,
              this.BRL_DECIMAL,
            ),
          )}*`;

      const formattedTransaction = [
        transaction.createdAt.toLocaleString('pt-BR'),
        translateCryptoReportType(transaction.type),
        transaction.crypto.symbol,
        `${formatValueFromFloatToPtBrlString(
          formatValueFromIntToFloat(
            transaction.cryptoAmount,
            this.coin.decimal,
          ),
        )}`,
        cryptoPrice,
        `${formatValueFromFloatToPtBrlString(
          formatValueFromIntToFloat(transaction.fiatAmount, this.BRL_DECIMAL),
        )}`,
        `${formatValueFromFloatToPtBrlString(
          formatValueFromIntToFloat(transaction.avgPrice, this.BRL_DECIMAL),
        )}`,
        `${formatValueFromFloatToPtBrlString(
          formatValueFromIntToFloat(
            transaction.cryptoBalance,
            this.coin.decimal,
          ),
        )}`,
        `${formatValueFromFloatToPtBrlString(
          formatValueFromIntToFloat(transaction.profit, this.BRL_DECIMAL),
        )}`,
        `${formatValueFromFloatToPtBrlString(
          formatValueFromIntToFloat(transaction.loss, this.BRL_DECIMAL),
        )}`,
        `${formatValueFromFloatToPtBrlString(
          formatValueFromIntToFloat(
            transaction.profitLossPercentage,
            this.BRL_DECIMAL,
          ),
        )}`,
      ];

      transactionsTable.rows.push(formattedTransaction);
    }

    // Draw the table
    this.doc.moveDown();

    await this.createTable(transactionsTable, 10, 180, { width: 590 });

    this.doc.addPage();

    await this.createPageHeader();

    // Create the table
    const resultsTable: CryptoReportTable = {
      headers: cryptoReportProperties.subtotalsTableHeader,
      rows: [],
    };

    const finalResultTable: CryptoReportTable = {
      headers: cryptoReportProperties.totalsTableHeader,
      rows: [],
    };

    // Add the crypto report results to the table
    for (const result of this.cryptoReportResults) {
      if (result.createdAt) {
        const month = getMoment(result.createdAt).month();
        const year = getMoment(result.createdAt).year();

        const formattedResult = [
          `${cryptoReportProperties.monthNames[month]}/${year}`,
          `${formatValueFromFloatToPtBrlString(
            formatValueFromIntToFloat(
              result.fiatAmountSalesTotal,
              this.BRL_DECIMAL,
            ),
          )}`,
          `${formatValueFromFloatToPtBrlString(
            formatValueFromIntToFloat(result.profitTotal, this.BRL_DECIMAL),
          )}`,
          `${formatValueFromFloatToPtBrlString(
            formatValueFromIntToFloat(result.lossTotal, this.BRL_DECIMAL),
          )}`,
          `${formatValueFromFloatToPtBrlString(
            formatValueFromIntToFloat(
              result.profitLossPercentageTotal,
              this.BRL_DECIMAL,
            ),
          )}`,
        ];

        resultsTable.rows.push(formattedResult);
      }

      if (!result.createdAt) {
        const formattedResult = [
          `${this.createdAtStartDate} - ${this.createdAtEndDate}`,
          `${formatValueFromFloatToPtBrlString(
            formatValueFromIntToFloat(
              result.fiatAmountSalesTotal,
              this.BRL_DECIMAL,
            ),
          )}`,
          `${formatValueFromFloatToPtBrlString(
            formatValueFromIntToFloat(result.profitTotal, this.BRL_DECIMAL),
          )}`,
          `${formatValueFromFloatToPtBrlString(
            formatValueFromIntToFloat(result.lossTotal, this.BRL_DECIMAL),
          )}`,
          `${formatValueFromFloatToPtBrlString(
            formatValueFromIntToFloat(
              result.profitLossPercentageTotal,
              this.BRL_DECIMAL,
            ),
          )}`,
        ];

        finalResultTable.rows.push(formattedResult);
      }
    }

    // Draw the table
    this.doc.moveDown();

    await this.createTable(resultsTable, 10, 180, { width: 590 });

    // Draw the table
    this.doc.moveDown();

    await this.createTable(finalResultTable, 10, { width: 590 });

    // Finalize the PDF and end the stream
    await this.savePdfToFile(this.doc, this.fileName);
  }

  /**
   * To determine when the PDF has finished being written successfully,
   * we need to confirm the following 2 conditions:
   * 1. The write stream has been closed
   * 2. PDFDocument.end() was called syncronously without an error being thrown
   */
  private async savePdfToFile(
    pdf: PDFKit.PDFDocument,
    fileName: string,
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      let pendingStepCount = 2;

      const stepFinished = () => {
        if (--pendingStepCount == 0) {
          resolve();
        }
      };

      const writeStream = fs.createWriteStream(fileName);
      writeStream.on('close', stepFinished);
      pdf.pipe(writeStream);

      pdf.end();

      stepFinished();
    });
  }

  private async createTable(
    table: CryptoReportTable,
    arg0: number | object,
    arg1?: number | object,
    arg2?: object,
  ): Promise<void> {
    let startX = this.doc.page.margins.left,
      startY = this.doc.y;
    let options: any = {};

    if (typeof arg0 === 'number' && typeof arg1 === 'number') {
      startX = arg0;
      startY = arg1;

      if (typeof arg2 === 'object') options = arg2;
    } else if (typeof arg0 === 'object') {
      options = arg0;
    } else if (typeof arg0 === 'number' && typeof arg1 === 'object') {
      startX = arg0;
      options = arg1;
    }

    const columnCount = table.headers.length;
    const usableWidth =
      options.width ||
      this.doc.page.width -
        this.doc.page.margins.left -
        this.doc.page.margins.right;

    const computeRowHeight = (row: any) => {
      let result = 0;

      row.forEach((cell: any) => {
        const cellHeight = this.doc.heightOfString(cell, {
          width: columnWidth,
          align: 'left',
        });
        result = Math.max(result, cellHeight);
      });

      return result + this.COLUMN_AND_ROW_SPACING;
    };

    const columnContainerWidth = usableWidth / columnCount;
    const columnWidth = columnContainerWidth - this.COLUMN_AND_ROW_SPACING;
    const maxY = this.doc.page.height - this.doc.page.margins.bottom;

    let rowBottomY = 0;

    this.doc.on('pageAdded', () => {
      startY = 30;
      rowBottomY = 0;
    });

    // Check to have enough room for header and first rows
    if (startY + 3 * computeRowHeight(table.headers) > maxY) {
      this.doc.addPage();
    }

    // Print all headers
    this.doc
      .rect(
        startX,
        startY - this.COLUMN_AND_ROW_SPACING,
        usableWidth,
        computeRowHeight(table.headers),
      )
      .fill(cryptoReportProperties.backgroundHeaderColor);

    table.headers.forEach((header: string, i: number) => {
      this.doc
        .font(cryptoReportProperties.fontBold)
        .fontSize(7)
        .fillColor(cryptoReportProperties.fontWhiteColor)
        .text(header, startX + i * columnContainerWidth, startY, {
          width: columnWidth,
          align: 'center',
          baseline: 'middle',
        });
    });

    // Refresh the y coordinate of the bottom of the headers row
    rowBottomY = Math.max(startY + computeRowHeight(table.headers), rowBottomY);

    // Separation line between headers and rows
    this.doc
      .moveTo(
        startX,
        rowBottomY - this.COLUMN_AND_ROW_SPACING * this.HEADER_LINE_SPACING,
      )
      .lineTo(
        startX + usableWidth,
        rowBottomY - this.COLUMN_AND_ROW_SPACING * this.HEADER_LINE_SPACING,
      )
      .lineWidth(1);

    table.rows.forEach(async (row: any, i: number) => {
      const rowHeight = computeRowHeight(row);

      // Switch to next page if we cannot go any further because the space is over.
      // For safety, consider 3 rows margin instead of just one
      if (startY + 3 * rowHeight < maxY)
        startY = rowBottomY + this.COLUMN_AND_ROW_SPACING;
      else {
        this.doc.addPage();
      }

      // Print all cells of the current row
      // Fill background with alternated colors.
      if (i % 2 === 0) {
        this.doc
          .rect(
            startX,
            startY - 2 * this.COLUMN_AND_ROW_SPACING,
            usableWidth,
            rowHeight,
          )
          .fill(cryptoReportProperties.backgroundWhiteColor);
      } else {
        this.doc
          .rect(
            startX,
            startY - 2 * this.COLUMN_AND_ROW_SPACING,
            usableWidth,
            rowHeight,
          )
          .fill(cryptoReportProperties.backgroundLightColor);
      }

      row.forEach((cell: string, i: number) => {
        this.doc
          .fillColor(cryptoReportProperties.fontColor)
          .font(cryptoReportProperties.font)
          .fontSize(7);

        this.doc.text(cell, startX + i * columnContainerWidth, startY, {
          width: columnWidth,
          align: 'left',
          baseline: 'middle',
        });
      });

      // Refresh the y coordinate of the bottom of this row
      rowBottomY = Math.max(startY + rowHeight, rowBottomY);

      // Separation line between rows
      this.doc
        .moveTo(
          startX,
          rowBottomY - this.COLUMN_AND_ROW_SPACING * this.ROW_LINE_SPACING,
        )
        .lineTo(
          startX + usableWidth,
          rowBottomY - this.COLUMN_AND_ROW_SPACING * this.ROW_LINE_SPACING,
        )
        .lineWidth(this.LINE_WIDTH);
    });

    this.doc.x = startX;
    this.doc.moveDown();
  }

  private async createPageHeader(): Promise<void> {
    const response = await axios.get(this.zrobankLogoUrl, {
      responseType: 'arraybuffer',
    });

    if (response?.data) {
      const logo = response.data;

      this.doc.image(logo, 20, 15, {
        width: 70,
        align: 'center',
      });
    }

    this.doc
      .fillColor(cryptoReportProperties.fontColor)
      .font(cryptoReportProperties.fontBold)
      .fontSize(16)
      .text(cryptoReportProperties.title, 60, 40, { align: 'center' })
      .fontSize(7)
      .text(cryptoReportProperties.subtitle, 60, 70, {
        align: 'center',
        lineBreak: true,
      })
      .fontSize(5)
      .text(cryptoReportProperties.companyName, 20, 70, {
        align: 'left',
      })
      .fontSize(7)
      .text(
        cryptoReportProperties.clientName,
        this.CLIENT_MENU_X_POSITION,
        95,
        { align: 'left' },
      )
      .text(
        cryptoReportProperties.clientDocument,
        this.CLIENT_MENU_X_POSITION,
        105,
        { align: 'left' },
      )
      .text(cryptoReportProperties.currency, this.CLIENT_MENU_X_POSITION, 115, {
        align: 'left',
      })
      .text(
        cryptoReportProperties.dateRange,
        this.CLIENT_MENU_X_POSITION,
        125,
        { align: 'left' },
      )
      .text(
        cryptoReportProperties.emittedAt,
        this.CLIENT_MENU_X_POSITION,
        135,
        { align: 'left' },
      )
      .font(cryptoReportProperties.font)
      .fontSize(5)
      .text(cryptoReportProperties.companyDocument, 20, 80, {
        align: 'left',
      })
      .fontSize(7)
      .text(
        `${this.userName.substring(0, this.NAME_MAX_LENGTH)}`,
        this.CLIENT_MENU_DATA_X_POSITION,
        95,
        {
          align: 'left',
        },
      )
      .text(`${this.userDocument}`, this.CLIENT_MENU_DATA_X_POSITION, 105, {
        align: 'left',
      })
      .text(
        `${this.coin.title} (${this.coin.symbol})`,
        this.CLIENT_MENU_DATA_X_POSITION,
        115,
        {
          align: 'left',
        },
      )
      .text(
        `${this.createdAtStartDate} - ${this.createdAtEndDate}`,
        this.CLIENT_MENU_DATA_X_POSITION,
        125,
        {
          align: 'left',
          lineBreak: false,
        },
      )
      .text(`${this.emittedAt}`, this.CLIENT_MENU_DATA_X_POSITION, 135, {
        align: 'left',
      })
      .fontSize(6)
      .text(cryptoReportProperties.notes, 10, 160, { align: 'left' })
      .moveDown();
  }
}
