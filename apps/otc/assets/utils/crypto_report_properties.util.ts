import { CryptoReportType } from '@zro/otc/domain';

export const cryptoReportProperties = {
  companyName: 'ZRO PAGAMENTOS S/A',
  companyDocument: 'CNPJ 26.264.220/0001-16',
  title: 'Detalhamento de Rendimentos',
  subtitle:
    'Detalhamento de movimentações em criptomoeda e rendimentos em relação ao Real brasileiro. Não tem valor fiscal.',
  clientName: 'Nome: ',
  clientDocument: 'Documento: ',
  currency: 'Moeda: ',
  dateRange: 'Periodo: ',
  emittedAt: 'Emitido em: ',
  notes:
    'Nota: Valores assinalados com asterisco (*) indicam cotações aproximadas geradas pelo Zro no instante da transação.',
  transactionsTableHeader: [
    'Data/Hora',
    'Operação',
    'Moeda',
    'Quantidade',
    'Cotação (R$)',
    'Total (R$)',
    'Cotação Média (R$)',
    'Saldo Moeda',
    'Ganho sobre venda (R$)',
    'Custo sobre venda (R$)',
    'Ganho percentual (%)',
  ],
  subtotalsTableHeader: [
    'Subtotal Mês/Ano',
    'Subtotal Venda (R$)',
    'Subtotal Ganho (R$)',
    'Subtotal Custo (R$)',
    'Subtotal Ganho (%)',
  ],
  totalsTableHeader: [
    'Total',
    'Total Venda (R$)',
    'Total Ganho (R$)',
    'Total Custo (R$)',
    'Total Ganho (%)',
  ],
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  font: 'Helvetica',
  fontBold: 'Helvetica-Bold',
  // For PDF:
  fontColor: '#292864',
  fontWhiteColor: '#FFFFFF',
  backgroundHeaderColor: '#292864',
  backgroundLightColor: '#D2E6EE',
  backgroundWhiteColor: '#FFFFFF',
  // For XLSX:
  tableBackgroundDarkColor: '292864',
  tableBackgroundLightColor: 'D2E6EE',
  tableWhiteColor: 'FFFFFF',
  tableTabColor: '292864',
  tableFontColor: '292864',
};

export const CRYPTO_REPORT_TYPE = {
  [CryptoReportType.BUY]: 'Compra',
  [CryptoReportType.SELL]: 'Venda',
  [CryptoReportType.DEPOSIT]: 'Depósito',
  [CryptoReportType.WITHDRAWAL]: 'Saque',
  [CryptoReportType.CASHBACK]: 'Cashback',
};

export function translateCryptoReportType(type: CryptoReportType): string {
  return CRYPTO_REPORT_TYPE[type] ?? type;
}
