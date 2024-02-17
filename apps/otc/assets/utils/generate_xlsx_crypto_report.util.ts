import * as xlsx from 'exceljs';
import axios from 'axios';
import {
  CryptoReportResultRow,
  CryptoReportRow,
  cryptoReportProperties,
  translateCryptoReportType,
} from '@zro/assets/otc';
import { Currency } from '@zro/operations/domain';
import {
  formatFullName,
  formatValueFromFloatToEnUsString,
  formatValueFromIntToFloat,
  getMoment,
} from '@zro/common';

export class GenerateXlsxCryptoReport {
  private fileName: string;
  private transactions: CryptoReportRow[];
  private userName: string;
  private userDocument: string;
  private currency: Currency;
  private createdAtStartDate: string;
  private createdAtEndDate: string;
  private cryptoReportResults: CryptoReportResultRow[];
  private emittedAt: string;
  private zrobankLogoUrl: string;

  private readonly BRL_DECIMAL = 2;
  private readonly NUMBER_FORMAT = '#,##0.00';
  private readonly ROW_HEIGHT = 20;
  private readonly ROW_START_Y_POSITION = 10;

  constructor(
    _fileName: string,
    _transactions: CryptoReportRow[],
    _userName: string,
    _userDocument: string,
    _currency: Currency,
    _createdAtStartDate: Date,
    _createdAtEndDate: Date,
    _cryptoReportResults: CryptoReportResultRow[],
    _zrobankLogoUrl: string,
  ) {
    this.fileName = _fileName;
    this.transactions = _transactions;
    this.userName = formatFullName(_userName);
    this.userDocument = _userDocument;
    this.currency = _currency;
    this.createdAtStartDate = _createdAtStartDate.toLocaleDateString('pt-BR');
    this.createdAtEndDate = _createdAtEndDate.toLocaleDateString('pt-BR');
    this.cryptoReportResults = _cryptoReportResults;
    this.emittedAt = getMoment().toDate().toLocaleDateString('pt-BR');
    this.zrobankLogoUrl = _zrobankLogoUrl;
  }

  async execute(): Promise<void> {
    // Create workbook
    const workbook = new xlsx.Workbook();

    // Create worksheet
    const worksheet = workbook.addWorksheet(this.currency.symbol, {
      properties: {
        tabColor: { argb: cryptoReportProperties.tableTabColor },
      },
    });

    // Create sheet styles and introduction texts
    const [fonts, alignments] = await this.createPageStyle(workbook, worksheet);

    // Row position editable
    let y = this.ROW_START_Y_POSITION;

    // Create crypto transactions table header
    let row = worksheet.getRow(y);
    row.height = this.ROW_HEIGHT;
    row.alignment = alignments[0];
    row.font = fonts[3];
    row.values = cryptoReportProperties.transactionsTableHeader;

    await this.colorHeaderRow(row);

    y++;

    // Create crypto transactions table values
    this.transactions.forEach((transaction) => {
      // If price is estimated, add a * to the value
      const cryptoPrice = transaction.accuratePrice
        ? formatValueFromIntToFloat(transaction.cryptoPrice, this.BRL_DECIMAL)
        : `${formatValueFromFloatToEnUsString(
            formatValueFromIntToFloat(
              transaction.cryptoPrice,
              this.BRL_DECIMAL,
            ),
          )}*`;

      row = worksheet.getRow(y);
      row.alignment = alignments[1];
      row.font = fonts[2];

      // Format currency decimals
      let decimal = this.currency.decimal;
      let decimalString = '';
      while (decimal != 0) {
        decimalString += '0';
        --decimal;
      }

      // Add formatted values to the table
      row.values = [
        transaction.createdAt.toLocaleString('pt-BR'),
        translateCryptoReportType(transaction.type),
        transaction.crypto.symbol,
        formatValueFromIntToFloat(
          transaction.cryptoAmount,
          this.currency.decimal,
        ),
        cryptoPrice,
        formatValueFromIntToFloat(transaction.fiatAmount, this.BRL_DECIMAL),
        formatValueFromIntToFloat(transaction.avgPrice, this.BRL_DECIMAL),
        formatValueFromIntToFloat(
          transaction.cryptoBalance,
          this.currency.decimal,
        ),
        formatValueFromIntToFloat(transaction.profit, this.BRL_DECIMAL),
        formatValueFromIntToFloat(transaction.loss, this.BRL_DECIMAL),
        formatValueFromIntToFloat(
          transaction.profitLossPercentage,
          this.BRL_DECIMAL,
        ),
      ];

      // Align numbers to the right and texts to the left
      for (
        let i = 1;
        i <= cryptoReportProperties.transactionsTableHeader.length;
        i++
      ) {
        if ([1, 2, 3].includes(i))
          (row.findCell(i) as xlsx.Cell).alignment = alignments[0];
        else (row.findCell(i) as xlsx.Cell).alignment = alignments[1];
        if ([4, 8].includes(i))
          (row.findCell(i) as xlsx.Cell).numFmt = `#,##0.${decimalString}`;
        else (row.findCell(i) as xlsx.Cell).numFmt = this.NUMBER_FORMAT;
      }

      // Alternate row background colors for better reading
      if (y % 2 == 0) this.darkColorTableRow(row);
      else this.lightColorTableRow(row);

      y++;
    });

    // Create subtotals table header
    row = worksheet.getRow(++y);
    row.height = 20;
    row.alignment = alignments[0];
    row.font = fonts[3];
    row.values = cryptoReportProperties.subtotalsTableHeader;

    await this.colorHeaderRow(row);

    y++;

    // Create subtotals table values
    this.cryptoReportResults.forEach((result) => {
      row = worksheet.getRow(y);
      row.alignment = alignments[1];
      row.font = fonts[2];
      row.numFmt = this.NUMBER_FORMAT;

      // Add formatted values to the table
      if (result.createdAt) {
        const month = getMoment(result.createdAt).month();
        const year = getMoment(result.createdAt).year();

        row.values = [
          `${cryptoReportProperties.monthNames[month]}/${year}`,
          formatValueFromIntToFloat(
            result.fiatAmountSalesTotal,
            this.BRL_DECIMAL,
          ),
          formatValueFromIntToFloat(result.profitTotal, this.BRL_DECIMAL),
          formatValueFromIntToFloat(result.lossTotal, this.BRL_DECIMAL),
          formatValueFromIntToFloat(
            result.profitLossPercentageTotal,
            this.BRL_DECIMAL,
          ),
        ];

        // Align numbers to the right and texts to the left
        for (
          let i = 1;
          i <= cryptoReportProperties.subtotalsTableHeader.length;
          i++
        ) {
          if (i === 1) (row.findCell(i) as xlsx.Cell).alignment = alignments[0];
          else (row.findCell(i) as xlsx.Cell).alignment = alignments[1];
        }

        // Alternate row background colors for better reading
        if (y % 2 == 0) this.darkColorTableRow(row);
        else this.lightColorTableRow(row);

        y++;
      }
    });

    // Create totals table header
    row = worksheet.getRow(++y);
    row.height = this.ROW_HEIGHT;
    row.alignment = alignments[0];
    row.font = fonts[3];
    row.values = cryptoReportProperties.totalsTableHeader;

    await this.colorHeaderRow(row);

    y++;

    // Create totals table values
    this.cryptoReportResults.forEach((result) => {
      row = worksheet.getRow(y);
      row.alignment = alignments[1];
      row.font = fonts[2];
      row.numFmt = this.NUMBER_FORMAT;

      if (!result.createdAt) {
        row.values = [
          `${this.createdAtStartDate} - ${this.createdAtEndDate}`,
          formatValueFromIntToFloat(
            result.fiatAmountSalesTotal,
            this.BRL_DECIMAL,
          ),
          formatValueFromIntToFloat(result.profitTotal, this.BRL_DECIMAL),
          formatValueFromIntToFloat(result.lossTotal, this.BRL_DECIMAL),
          formatValueFromIntToFloat(
            result.profitLossPercentageTotal,
            this.BRL_DECIMAL,
          ),
        ];

        // Align numbers to the right and texts to the left
        for (
          let i = 1;
          i <= cryptoReportProperties.totalsTableHeader.length;
          i++
        ) {
          if (i === 1) (row.findCell(i) as xlsx.Cell).alignment = alignments[0];
          else (row.findCell(i) as xlsx.Cell).alignment = alignments[1];
        }

        // Define row background color for better reading
        this.lightColorTableRow(row);

        y++;
      }
    });

    // Create worksheet file and finish
    await workbook.xlsx.writeFile(this.fileName);
  }

  // Table headers are in a stronger color for better reading
  private colorHeaderRow(row: xlsx.Row): void {
    row.eachCell(function (cell) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: cryptoReportProperties.tableBackgroundDarkColor,
        },
      };
    });
  }

  // Table rows intercalate colors for better reading
  private darkColorTableRow(row: xlsx.Row): void {
    row.eachCell(function (cell) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: cryptoReportProperties.tableBackgroundLightColor,
        },
      };
    });
  }

  // Table rows intercalate colors for better reading
  private lightColorTableRow(row: xlsx.Row): void {
    row.eachCell(function (cell) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: cryptoReportProperties.tableWhiteColor,
        },
      };
    });
  }

  // Page style and header layout
  private async createPageStyle(
    workbook: xlsx.Workbook,
    worksheet: xlsx.Worksheet,
  ): Promise<[Partial<xlsx.Font>[], Partial<xlsx.Alignment>[]]> {
    // Define columns width
    worksheet.columns = [
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
    ];

    // Add logo
    const response = await axios.get(this.zrobankLogoUrl, {
      responseType: 'arraybuffer',
    });

    if (response?.data) {
      const logo = response.data;

      const imageId = workbook.addImage({
        buffer: logo,
        extension: 'png',
      });

      worksheet.addImage(imageId, {
        tl: { col: 0.35, row: 0 },
        ext: { width: 140, height: 140 },
      });
    }

    // Styles
    const fonts: Partial<xlsx.Font>[] = [
      {
        name: cryptoReportProperties.font,
        size: 8,
        underline: false,
        bold: true,
        color: { argb: cryptoReportProperties.tableFontColor },
      },
      {
        name: cryptoReportProperties.font,
        size: 16,
        underline: false,
        bold: true,
        color: { argb: cryptoReportProperties.tableFontColor },
      },
      {
        name: cryptoReportProperties.font,
        size: 8,
        underline: false,
        bold: false,
        color: { argb: cryptoReportProperties.tableFontColor },
      },
      {
        name: cryptoReportProperties.font,
        size: 10,
        underline: false,
        bold: true,
        color: { argb: cryptoReportProperties.tableWhiteColor },
      },
    ];
    const alignments: Partial<xlsx.Alignment>[] = [
      { vertical: 'middle', horizontal: 'center' },
      { vertical: 'middle', horizontal: 'right' },
      { vertical: 'middle', horizontal: 'left' },
    ];

    // Header texts
    worksheet.getCell('A6').font = fonts[0];
    worksheet.getCell('A6').alignment = alignments[0];
    worksheet.getCell('A6').value = cryptoReportProperties.companyName;
    worksheet.getCell('A7').font = fonts[2];
    worksheet.getCell('A7').alignment = alignments[0];
    worksheet.getCell('A7').value = cryptoReportProperties.companyDocument;
    worksheet.getCell('B2').font = fonts[1];
    worksheet.getCell('B2').alignment = alignments[0];
    worksheet.getCell('B2').value = cryptoReportProperties.title;
    worksheet.mergeCells('B2:K2');
    worksheet.getCell('B3').font = fonts[0];
    worksheet.getCell('B3').alignment = alignments[0];
    worksheet.getCell('B3').value = cryptoReportProperties.subtitle;
    worksheet.mergeCells('B3:K3');
    worksheet.getCell('D5').font = fonts[0];
    worksheet.getCell('D5').alignment = alignments[2];
    worksheet.getCell('D5').value = cryptoReportProperties.clientName;
    worksheet.getCell('D6').font = fonts[0];
    worksheet.getCell('D6').alignment = alignments[2];
    worksheet.getCell('D6').value = cryptoReportProperties.clientDocument;
    worksheet.getCell('D7').font = fonts[0];
    worksheet.getCell('D7').alignment = alignments[2];
    worksheet.getCell('D7').value = cryptoReportProperties.currency;
    worksheet.getCell('H5').font = fonts[0];
    worksheet.getCell('H5').alignment = alignments[2];
    worksheet.getCell('H5').value = cryptoReportProperties.dateRange;
    worksheet.getCell('H6').font = fonts[0];
    worksheet.getCell('H6').alignment = alignments[2];
    worksheet.getCell('H6').value = cryptoReportProperties.emittedAt;
    worksheet.getCell('E5').font = fonts[2];
    worksheet.getCell('E5').alignment = alignments[2];
    worksheet.getCell('E5').value = `${this.userName}`;
    worksheet.mergeCells('E5:F5');
    worksheet.getCell('E6').font = fonts[2];
    worksheet.getCell('E6').alignment = alignments[2];
    worksheet.getCell('E6').value = `${this.userDocument}`;
    worksheet.mergeCells('E6:F6');
    worksheet.getCell('E7').font = fonts[2];
    worksheet.getCell('E7').alignment = alignments[2];
    worksheet.getCell(
      'E7',
    ).value = `${this.currency.title} (${this.currency.symbol})`;
    worksheet.mergeCells('E7:F7');
    worksheet.getCell('I5').font = fonts[2];
    worksheet.getCell('I5').alignment = alignments[2];
    worksheet.getCell(
      'I5',
    ).value = `${this.createdAtStartDate} - ${this.createdAtEndDate}`;
    worksheet.mergeCells('I5:I5');
    worksheet.getCell('I6').font = fonts[2];
    worksheet.getCell('I6').alignment = alignments[2];
    worksheet.getCell('I6').value = `${this.emittedAt}`;
    worksheet.mergeCells('I6:I6');
    worksheet.getCell('A9').font = fonts[2];
    worksheet.getCell('A9').alignment = alignments[2];
    worksheet.getCell('A9').value = cryptoReportProperties.notes;
    worksheet.mergeCells('A9:K9');

    return [fonts, alignments];
  }
}
