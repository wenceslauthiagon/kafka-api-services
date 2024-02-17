import { PersonDocumentType } from '@zro/users/domain';
import { formatCnpj } from './format_cnpj.util';
import { formatCpf, formatCpfWithoutMask } from './format_cpf.util';
import { isCpf } from './is_cpf.util';

export enum ReceiptPortugueseTranslation {
  sendingData = 'Dados do envio',
  id = 'ID/Transação',
  sentValue = 'Valor enviado',
  dateTime = 'Data/hora',
  recipientInfo = 'Informações do destinatário',
  payerInfo = 'Informações do pagador',
  additionalInfo = 'Informações gerais',
  sourceInfo = 'Informações da origem',
  debtorInfo = 'Informações do devedor',
  name = 'Nome',
  dueDate = 'Data agendada para o pagamento',
  drawerInfo = 'Informações do sacador',
  purchaseValue = 'Valor da compra',
  changeValue = 'Valor do troco',
  finalValue = 'Valor final',
  originalValue = 'Valor original',
  deductionValue = 'Abatimento',
  discountValue = 'Desconto',
  feeValue = 'Juros',
  fineValue = 'Multa',
  description = 'Descrição',
  noDescription = 'Não informada',
  devolutionReason = 'Motivo da devolução',
  institution = 'Instituição',
  zrobank = 'ZRO PAGAMENTOS S.A.',
  pixSent = 'Você enviou um Pix',
  pixScheduled = 'Pix Agendado',
  pixChange = 'Pix Troco',
  pixDraw = 'Pix Saque',
  pixReturned = 'Pix Devolvido',
  pixReceived = 'Você recebeu um Pix',
  pixDevolution = 'Devolução de Pix',
  valueReceived = 'Valor recebido',
  devolutionInfo = 'Dados da devolução',
  devolutionValue = 'Valor devolvido',
  depositInfo = 'Dados do recebimento',
  originalDepositInfo = 'Dados do recebimento original',
  ted = 'TED',
  cov = 'Comprovante de conversão.',
  p2pbt = 'Transfêrencia entre contas',
  valueConverted = 'Valor convertido',
  conversionOf = 'Conversão de:',
  conversionTo = 'Para:',
  conversioFeeValue = 'Cotação de USD no momento',
  tag = 'Tag',
  value = 'Valor',
  withdraw = 'Comprovante de transferência',
  sourceAccount = 'Conta de origem',
  walletName = 'Carteira',
}

type ResponseValueObject = { [key: string]: string };

export const dateTimeFormat = 'DD/MM/YYYY - HH:mm:ss';
export const dateFormat = 'DD/MM/YYYY';

export function formatEndToEndId(
  endToEndId: string,
): { [key: string]: string }[] {
  return endToEndId ? [{ [ReceiptPortugueseTranslation.id]: endToEndId }] : [];
}

export function formatPersonDocument(document: string): ResponseValueObject {
  const isDocumentCpf = isCpf(document);
  const title = isDocumentCpf
    ? PersonDocumentType.CPF
    : PersonDocumentType.CNPJ;
  const formatedDocument = isDocumentCpf
    ? formatCpf(document)
    : formatCnpj(document);

  return { [title]: formatedDocument };
}

export function formatPersonDocumentWithoutMask(
  document: string,
): ResponseValueObject {
  const isDocumentCpf = isCpf(document);
  const title = isDocumentCpf
    ? PersonDocumentType.CPF
    : PersonDocumentType.CNPJ;
  const formatedDocument = isDocumentCpf
    ? formatCpfWithoutMask(document)
    : formatCnpj(document);

  return { [title]: formatedDocument };
}
