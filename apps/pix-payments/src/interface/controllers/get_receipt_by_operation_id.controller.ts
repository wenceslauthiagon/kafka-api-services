import { Logger } from 'winston';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  AutoValidator,
  formatCpf,
  isCpf,
  formatToFloatValueReal,
  formatDateAndTime,
  formatCnpj,
} from '@zro/common';
import { User, PersonDocumentType } from '@zro/users/domain';
import {
  Operation,
  OperationEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import {
  DecodedPixAccountRepository,
  DecodedQrCodeRepository,
  DecodedQrCodeType,
  Payment,
  PaymentRepository,
  PaymentState,
  PaymentType,
  DecodedQrCode,
  PixDeposit,
  PixDevolution,
  PixDevolutionReceived,
  PixDepositRepository,
  PixDevolutionRepository,
  PixDevolutionReceivedRepository,
  WarningPixDevolution,
  WarningPixDevolutionRepository,
} from '@zro/pix-payments/domain';
import {
  GetPaymentByOperationIdUseCase,
  GetPixDepositByOperationIdUseCase,
  GetPixDevolutionByOperationIdUseCase,
  GetPixDevolutionReceivedByOperationIdUseCase,
  GetWarningPixDevolutionByOperationIdUseCase,
} from '@zro/pix-payments/application';

// Response data objects are in portuguese
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
  warningPixDevolution = 'Pix Depósito em análise',
  pixDevolution = 'Devolução de Pix',
  valueReceived = 'Valor recebido',
  devolutionInfo = 'Dados da devolução',
  devolutionValue = 'Valor devolvido',
  depositInfo = 'Dados do recebimento',
  originalDepositInfo = 'Dados do recebimento original',
  warningPixReturned = 'Devolução de bloqueio cautelar',
}

const dateTimeFormat = 'DD/MM/YYYY - HH:mm:ss';
const dateFormat = 'DD/MM/YYYY';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];

type ResponseValueObject = { [key: string]: string };
type ResponseValueList = ResponseValueObject[];
export type PaymentData = { [key: string]: ResponseValueList }[];

type TGetReceiptByOperationIdRequest = {
  userId: UserId;
  walletId: WalletId;
  operationId: OperationId;
};

export class GetReceiptByOperationIdRequest
  extends AutoValidator
  implements TGetReceiptByOperationIdRequest
{
  @IsUUID(4)
  userId!: UserId;

  @IsUUID(4)
  walletId!: WalletId;

  @IsUUID(4)
  operationId!: OperationId;

  constructor(props: TGetReceiptByOperationIdRequest) {
    super(props);
  }
}

type TGetReceiptByOperationIdResponse = {
  paymentData: PaymentData;
  paymentTitle: string;
  operationId: OperationId;
  isScheduled?: boolean;
  activeDevolution?: boolean;
};

export class GetReceiptByOperationIdResponse
  extends AutoValidator
  implements TGetReceiptByOperationIdResponse
{
  @IsArray()
  @IsNotEmpty()
  paymentData!: PaymentData;

  @IsUUID(4)
  operationId!: OperationId;

  @IsString()
  @IsNotEmpty()
  paymentTitle!: string;

  @IsBoolean()
  isScheduled!: boolean;

  @IsBoolean()
  activeDevolution!: boolean;

  constructor(props: TGetReceiptByOperationIdResponse) {
    // Default values
    props.isScheduled = props.isScheduled ?? false;
    props.activeDevolution = props.activeDevolution ?? false;
    super(props);
  }
}

function formatEndToEndId(endToEndId: string): { [key: string]: string }[] {
  return endToEndId ? [{ [ReceiptPortugueseTranslation.id]: endToEndId }] : [];
}

function formatPersonDocument(document: string): ResponseValueObject {
  const isDocumentCpf = isCpf(document);
  const title = isDocumentCpf
    ? PersonDocumentType.CPF
    : PersonDocumentType.CNPJ;
  const formatedDocument = isDocumentCpf
    ? formatCpf(document)
    : formatCnpj(document);

  return { [title]: formatedDocument };
}

// DevolutionReceived sent
function devolutionReceivedSentPresenter(
  devolutionReceived: PixDevolutionReceived,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.sourceInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              devolutionReceived.payment.beneficiaryBankName,
          },
          formatPersonDocument(devolutionReceived.payment.beneficiaryDocument),
          {
            [ReceiptPortugueseTranslation.originalValue]:
              formatToFloatValueReal(devolutionReceived.payment.value),
          },
          {
            [ReceiptPortugueseTranslation.name]:
              devolutionReceived.payment.beneficiaryName,
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              devolutionReceived.payment.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.description]:
              devolutionReceived.payment.description ||
              ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.depositInfo]: [
          ...formatEndToEndId(devolutionReceived.endToEndId),
          {
            [ReceiptPortugueseTranslation.valueReceived]:
              formatToFloatValueReal(devolutionReceived.amount),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              devolutionReceived.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.description]:
              devolutionReceived.description ||
              ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixDevolution,
    operationId: devolutionReceived.operation.id,
  });

  return response;
}

// Devolution sent
function devolutionSentPresenter(
  devolution: PixDevolution,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.devolutionInfo]: [
          ...formatEndToEndId(devolution.endToEndId),
          {
            [ReceiptPortugueseTranslation.devolutionValue]:
              formatToFloatValueReal(devolution.amount),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              devolution.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.devolutionReason]:
              devolution.description ||
              ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.originalDepositInfo]: [
          {
            [ReceiptPortugueseTranslation.originalValue]:
              formatToFloatValueReal(devolution.deposit.amount),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              devolution.deposit.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.name]:
              devolution.deposit.thirdPartName,
          },
          formatPersonDocument(devolution.deposit.thirdPartDocument),
          ...formatEndToEndId(devolution.deposit.endToEndId),
          {
            [ReceiptPortugueseTranslation.institution]:
              devolution.deposit.thirdPartBank.name,
          },
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixReturned,
    operationId: devolution.operation.id,
  });

  return response;
}

// Deposit received
function depositReceivedPresenter(
  deposit: PixDeposit,
  activeDevolution: boolean,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.depositInfo]: [
          ...formatEndToEndId(deposit.endToEndId),
          {
            [ReceiptPortugueseTranslation.valueReceived]:
              formatToFloatValueReal(deposit.amount),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              deposit.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.description]:
              deposit.description || ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              deposit.thirdPartBank.name,
          },
          formatPersonDocument(deposit.thirdPartDocument),
          { [ReceiptPortugueseTranslation.name]: deposit.thirdPartName },
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixReceived,
    operationId: deposit.operation.id,
    activeDevolution,
  });

  return response;
}

// Warning deposit
function warningDepositPresenter(
  deposit: PixDeposit,
  activeDevolution: boolean,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.depositInfo]: [
          ...formatEndToEndId(deposit.endToEndId),
          {
            [ReceiptPortugueseTranslation.valueReceived]:
              formatToFloatValueReal(deposit.amount),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              deposit.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.description]:
              deposit.description || ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              deposit.thirdPartBank.name,
          },
          formatPersonDocument(deposit.thirdPartDocument),
          { [ReceiptPortugueseTranslation.name]: deposit.thirdPartName },
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.warningPixDevolution,
    operationId: deposit.operation.id,
    activeDevolution,
  });

  return response;
}

// Immediate PIX key (APP_OPERATION_SEND_KEY_TRANSACTION_TAG)
function byImmediatePixKeyPresenter(
  payment: Payment,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          ...formatEndToEndId(payment.endToEndId),
          {
            [ReceiptPortugueseTranslation.sentValue]: formatToFloatValueReal(
              payment.value,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              payment.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.description]:
              payment.description || ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              payment.beneficiaryBankName,
          },
          formatPersonDocument(payment.beneficiaryDocument),
          { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
          formatPersonDocument(payment.ownerDocument),
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixSent,
    operationId: payment.operation.id,
  });

  return response;
}

// Scheduled PIX key (APP_OPERATION_SEND_KEY_TRANSACTION_TAG)
function byScheduledPixKeyPresenter(
  payment: Payment,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          ...formatEndToEndId(payment.endToEndId),
          {
            [ReceiptPortugueseTranslation.dueDate]: formatDateAndTime(
              payment.paymentDate,
              dateFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.sentValue]: formatToFloatValueReal(
              payment.value,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              payment.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.description]:
              payment.description || ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              payment.beneficiaryBankName,
          },
          formatPersonDocument(payment.beneficiaryDocument),
          { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
          formatPersonDocument(payment.ownerDocument),
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixScheduled,
    operationId: payment.operation.id,
    isScheduled: true,
  });

  return response;
}

// Immediate account (APP_OPERATION_SEND_ACCOUNT_TRANSACTION_TAG)
function byImmediateAccountPresenter(
  payment: Payment,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          ...formatEndToEndId(payment.endToEndId),
          {
            [ReceiptPortugueseTranslation.sentValue]: formatToFloatValueReal(
              payment.value,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              payment.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.description]:
              payment.description || ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              payment.beneficiaryBankName,
          },
          formatPersonDocument(payment.beneficiaryDocument),
          { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
          formatPersonDocument(payment.ownerDocument),
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixSent,
    operationId: payment.operation.id,
  });

  return response;
}

// Scheduled account (APP_OPERATION_SEND_ACCOUNT_TRANSACTION_TAG)
function byScheduledAccountPresenter(
  payment: Payment,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          ...formatEndToEndId(payment.endToEndId),
          {
            [ReceiptPortugueseTranslation.dueDate]: formatDateAndTime(
              payment.paymentDate,
              dateFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.sentValue]: formatToFloatValueReal(
              payment.value,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              payment.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.description]:
              payment.description || ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              payment.beneficiaryBankName,
          },
          formatPersonDocument(payment.beneficiaryDocument),
          { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
          formatPersonDocument(payment.ownerDocument),
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixScheduled,
    operationId: payment.operation.id,
    isScheduled: true,
  });

  return response;
}

// Immediate static QR code (APP_OPERATION_SEND_QRS_TRANSACTION_TAG)
function byImmediateStaticQrCodePresenter(
  payment: Payment,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          ...formatEndToEndId(payment.endToEndId),
          {
            [ReceiptPortugueseTranslation.sentValue]: formatToFloatValueReal(
              payment.value,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              payment.createdAt,
              dateTimeFormat,
            ),
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              payment.beneficiaryBankName,
          },
          formatPersonDocument(payment.beneficiaryDocument),
          { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
          formatPersonDocument(payment.ownerDocument),
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixSent,
    operationId: payment.operation.id,
  });

  return response;
}

// Scheduled static QR code (APP_OPERATION_SEND_QRS_TRANSACTION_TAG)
function byScheduledStaticQrCodePresenter(
  payment: Payment,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          ...formatEndToEndId(payment.endToEndId),
          {
            [ReceiptPortugueseTranslation.dueDate]: formatDateAndTime(
              payment.paymentDate,
              dateFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.sentValue]: formatToFloatValueReal(
              payment.value,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              payment.createdAt,
              dateTimeFormat,
            ),
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              payment.beneficiaryBankName,
          },
          formatPersonDocument(payment.beneficiaryDocument),
          { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
          formatPersonDocument(payment.ownerDocument),
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixScheduled,
    operationId: payment.operation.id,
    isScheduled: true,
  });

  return response;
}

// Withdrawal by static QR code (APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG)
function byStaticQrCodeWithdrawalPresenter(
  payment: Payment,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          ...formatEndToEndId(payment.endToEndId),
          {
            [ReceiptPortugueseTranslation.sentValue]: formatToFloatValueReal(
              payment.value,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              payment.createdAt,
              dateTimeFormat,
            ),
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              payment.beneficiaryBankName,
          },
          formatPersonDocument(payment.beneficiaryDocument),
          { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
        ],
      },
      {
        [ReceiptPortugueseTranslation.drawerInfo]: [
          { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
          formatPersonDocument(payment.ownerDocument),
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixDraw,
    operationId: payment.operation.id,
  });

  return response;
}

// Withdrawal by dynamic QR code (APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG)
function byDynamicQrCodeWithdrawalPresenter(
  payment: Payment,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          ...formatEndToEndId(payment.endToEndId),
          {
            [ReceiptPortugueseTranslation.sentValue]: formatToFloatValueReal(
              payment.value,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              payment.createdAt,
              dateTimeFormat,
            ),
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              payment.beneficiaryBankName,
          },
          formatPersonDocument(payment.beneficiaryDocument),
          { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
        ],
      },
      {
        [ReceiptPortugueseTranslation.drawerInfo]: [
          { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
          formatPersonDocument(payment.ownerDocument),
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixDraw,
    operationId: payment.operation.id,
  });

  return response;
}

// Change by dynamic QR code (APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG)
function byDynamicQrCodeChangePresenter(
  payment: Payment,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          ...formatEndToEndId(payment.endToEndId),
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              payment.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.purchaseValue]:
              formatToFloatValueReal(payment.decodedQrCode.documentValue),
          },
          {
            [ReceiptPortugueseTranslation.changeValue]: formatToFloatValueReal(
              payment.value - payment.decodedQrCode.documentValue,
            ),
          },
          {
            [ReceiptPortugueseTranslation.finalValue]: formatToFloatValueReal(
              payment.value,
            ),
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              payment.beneficiaryBankName,
          },
          formatPersonDocument(payment.beneficiaryDocument),
          { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
        ],
      },
      {
        [ReceiptPortugueseTranslation.drawerInfo]: [
          { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
          formatPersonDocument(payment.ownerDocument),
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixChange,
    operationId: payment.operation.id,
  });

  return response;
}

// 'Informações do devedor' using payerDocument and payerName - Dynamic QR code with due date (APP_OPERATION_DUEDATE_QRD_TRANSACTION_TAG)
function byScheduledDynamicQrCodeDueDatePresenter(
  payment: Payment,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          {
            [ReceiptPortugueseTranslation.dueDate]: formatDateAndTime(
              payment.paymentDate,
              dateFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              payment.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.originalValue]:
              formatToFloatValueReal(payment.decodedQrCode.documentValue),
          },
          {
            [ReceiptPortugueseTranslation.deductionValue]:
              formatToFloatValueReal(payment.decodedQrCode.deductionValue),
          },
          {
            [ReceiptPortugueseTranslation.discountValue]:
              formatToFloatValueReal(payment.decodedQrCode.discountValue),
          },
          {
            [ReceiptPortugueseTranslation.feeValue]: formatToFloatValueReal(
              payment.decodedQrCode.interestValue,
            ),
          },
          {
            [ReceiptPortugueseTranslation.fineValue]: formatToFloatValueReal(
              payment.decodedQrCode.fineValue,
            ),
          },
          {
            [ReceiptPortugueseTranslation.finalValue]: formatToFloatValueReal(
              payment.decodedQrCode.paymentValue,
            ),
          },
          {
            [ReceiptPortugueseTranslation.description]:
              payment.description || ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              payment.beneficiaryBankName,
          },
          { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
          formatPersonDocument(payment.beneficiaryDocument),
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
          formatPersonDocument(payment.ownerDocument),
        ],
      },
      {
        [ReceiptPortugueseTranslation.debtorInfo]: [
          {
            [ReceiptPortugueseTranslation.name]:
              payment.decodedQrCode.payerName,
          },
          formatPersonDocument(payment.decodedQrCode.payerDocument),
        ],
      },
      {
        ...(payment.decodedQrCode.additionalInfos?.length && {
          [ReceiptPortugueseTranslation.additionalInfo]:
            additionalInfosPresenter(payment.decodedQrCode.additionalInfos),
        }),
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixScheduled,
    operationId: payment.operation.id,
    isScheduled: true,
  });

  return response;
}

// 'Informações do devedor' using payerDocument and payerName - Dynamic QR code with due date (APP_OPERATION_DUEDATE_QRD_TRANSACTION_TAG)
function byImmediateDynamicQrCodeDueDatePresenter(
  payment: Payment,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          ...formatEndToEndId(payment.endToEndId),
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              payment.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.originalValue]:
              formatToFloatValueReal(payment.decodedQrCode.documentValue),
          },
          {
            [ReceiptPortugueseTranslation.deductionValue]:
              formatToFloatValueReal(payment.decodedQrCode.deductionValue),
          },
          {
            [ReceiptPortugueseTranslation.discountValue]:
              formatToFloatValueReal(payment.decodedQrCode.discountValue),
          },
          {
            [ReceiptPortugueseTranslation.feeValue]: formatToFloatValueReal(
              payment.decodedQrCode.interestValue,
            ),
          },
          {
            [ReceiptPortugueseTranslation.fineValue]: formatToFloatValueReal(
              payment.decodedQrCode.fineValue,
            ),
          },
          {
            [ReceiptPortugueseTranslation.finalValue]: formatToFloatValueReal(
              payment.decodedQrCode.paymentValue,
            ),
          },
          {
            [ReceiptPortugueseTranslation.description]:
              payment.description || ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              payment.beneficiaryBankName,
          },
          { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
          formatPersonDocument(payment.beneficiaryDocument),
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
          formatPersonDocument(payment.ownerDocument),
        ],
      },
      {
        [ReceiptPortugueseTranslation.debtorInfo]: [
          {
            [ReceiptPortugueseTranslation.name]:
              payment.decodedQrCode.payerName,
          },
          formatPersonDocument(payment.decodedQrCode.payerDocument),
        ],
      },
      {
        ...(payment.decodedQrCode.additionalInfos?.length && {
          [ReceiptPortugueseTranslation.additionalInfo]:
            additionalInfosPresenter(payment.decodedQrCode.additionalInfos),
        }),
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixSent,
    operationId: payment.operation.id,
  });

  return response;
}

// 'Informações do devedor' using payerDocument and payerName - Immediate dynamic QR code (APP_OPERATION_SEND_QRD_TRANSACTION_TAG)
function byImmediateDynamicQrCodePresenter(
  payment: Payment,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          ...formatEndToEndId(payment.endToEndId),
          {
            [ReceiptPortugueseTranslation.sentValue]: formatToFloatValueReal(
              payment.value,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              payment.createdAt,
              dateTimeFormat,
            ),
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              payment.beneficiaryBankName,
          },
          formatPersonDocument(payment.beneficiaryDocument),
          { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
        ],
      },
      {
        [ReceiptPortugueseTranslation.debtorInfo]: [
          {
            [ReceiptPortugueseTranslation.name]:
              payment.decodedQrCode.payerName,
          },
          formatPersonDocument(payment.decodedQrCode.payerDocument),
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
          formatPersonDocument(payment.ownerDocument),
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixSent,
    operationId: payment.operation.id,
  });

  return response;
}

// 'Informações do devedor' using payerDocument and payerName - Scheduled dynamic QR code (APP_OPERATION_SEND_QRD_TRANSACTION_TAG )
function byScheduledDynamicQrCodePresenter(
  payment: Payment,
): GetReceiptByOperationIdResponse {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.sendingData]: [
          ...formatEndToEndId(payment.endToEndId),
          {
            [ReceiptPortugueseTranslation.dueDate]: formatDateAndTime(
              payment.paymentDate,
              dateFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.sentValue]: formatToFloatValueReal(
              payment.value,
            ),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              payment.createdAt,
              dateTimeFormat,
            ),
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.recipientInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              payment.beneficiaryBankName,
          },
          formatPersonDocument(payment.beneficiaryDocument),
          { [ReceiptPortugueseTranslation.name]: payment.beneficiaryName },
        ],
      },
      {
        [ReceiptPortugueseTranslation.debtorInfo]: [
          {
            [ReceiptPortugueseTranslation.name]:
              payment.decodedQrCode.payerName,
          },
          formatPersonDocument(payment.decodedQrCode.payerDocument),
        ],
      },
      {
        [ReceiptPortugueseTranslation.payerInfo]: [
          {
            [ReceiptPortugueseTranslation.institution]:
              ReceiptPortugueseTranslation.zrobank,
          },
          { [ReceiptPortugueseTranslation.name]: payment.ownerFullName },
          formatPersonDocument(payment.ownerDocument),
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.pixScheduled,
    operationId: payment.operation.id,
    isScheduled: true,
  });

  return response;
}

function additionalInfosPresenter(
  infos: DecodedQrCode['additionalInfos'],
): ResponseValueList {
  return infos.reduce((acc, item) => [...acc, { [item.name]: item.value }], []);
}

function warningPixDevolutionPresenter(
  warningPixDevolution: WarningPixDevolution,
  deposit: PixDeposit,
) {
  const response = new GetReceiptByOperationIdResponse({
    paymentData: [
      {
        [ReceiptPortugueseTranslation.devolutionInfo]: [
          ...formatEndToEndId(warningPixDevolution.endToEndId),
          {
            [ReceiptPortugueseTranslation.devolutionValue]:
              formatToFloatValueReal(warningPixDevolution.amount),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              warningPixDevolution.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.devolutionReason]:
              warningPixDevolution.description ||
              ReceiptPortugueseTranslation.noDescription,
          },
        ],
      },
      {
        [ReceiptPortugueseTranslation.originalDepositInfo]: [
          {
            [ReceiptPortugueseTranslation.originalValue]:
              formatToFloatValueReal(deposit.amount),
          },
          {
            [ReceiptPortugueseTranslation.dateTime]: formatDateAndTime(
              deposit.createdAt,
              dateTimeFormat,
            ),
          },
          {
            [ReceiptPortugueseTranslation.name]: deposit.thirdPartName,
          },
          formatPersonDocument(deposit.thirdPartDocument),
          ...formatEndToEndId(deposit.endToEndId),
          {
            [ReceiptPortugueseTranslation.institution]:
              deposit.thirdPartBank.name,
          },
        ],
      },
    ],
    paymentTitle: ReceiptPortugueseTranslation.warningPixReturned,
    operationId: warningPixDevolution.operation.id,
  });
  return response;
}

export class GetReceiptByOperationIdController {
  private readonly getPaymentByOperationIdUseCase: GetPaymentByOperationIdUseCase;
  private readonly getPixDepositByOperationIdUseCase: GetPixDepositByOperationIdUseCase;
  private readonly getPixDevolutionByOperationIdUseCase: GetPixDevolutionByOperationIdUseCase;
  private readonly getPixDevolutionReceivedByOperationIdUseCase: GetPixDevolutionReceivedByOperationIdUseCase;
  private readonly getWarningPixDevolutionByOperationIdUseCase: GetWarningPixDevolutionByOperationIdUseCase;

  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
    depositRepository: PixDepositRepository,
    devolutionRepository: PixDevolutionRepository,
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    decodedQrCodeRepositoy: DecodedQrCodeRepository,
    decodedPixAccountRepository: DecodedPixAccountRepository,
    warningPixDevolutionRepository: WarningPixDevolutionRepository,
    private readonly depositDevolutionIntervalDays: number,
  ) {
    this.logger = logger.child({
      context: GetReceiptByOperationIdController.name,
    });

    this.getPaymentByOperationIdUseCase = new GetPaymentByOperationIdUseCase(
      this.logger,
      paymentRepository,
      decodedQrCodeRepositoy,
      decodedPixAccountRepository,
    );

    this.getPixDepositByOperationIdUseCase =
      new GetPixDepositByOperationIdUseCase(this.logger, depositRepository);

    this.getPixDevolutionByOperationIdUseCase =
      new GetPixDevolutionByOperationIdUseCase(
        this.logger,
        devolutionRepository,
        depositRepository,
      );

    this.getPixDevolutionReceivedByOperationIdUseCase =
      new GetPixDevolutionReceivedByOperationIdUseCase(
        this.logger,
        devolutionReceivedRepository,
        paymentRepository,
      );

    this.getWarningPixDevolutionByOperationIdUseCase =
      new GetWarningPixDevolutionByOperationIdUseCase(
        this.logger,
        warningPixDevolutionRepository,
      );
  }

  async execute(
    request: GetReceiptByOperationIdRequest,
  ): Promise<GetReceiptByOperationIdResponse> {
    this.logger.debug('Get payment receipt by operation id request.', {
      request,
    });

    const { operationId, walletId } = request;

    const wallet = new WalletEntity({ uuid: walletId });
    const operation = new OperationEntity({ id: operationId });

    const foundPayment = await this.getPaymentByOperationIdUseCase.execute(
      operation,
      null,
      wallet,
    );

    if (foundPayment) {
      if (!foundPayment.hasReceipt()) {
        return null;
      }

      const getReceipt = {
        [PaymentType.ACCOUNT]: this.getAccountReceipt,
        [PaymentType.KEY]: this.getKeyReceipt,
        [PaymentType.QR_CODE]: this.getQrCodeReceipt.bind(this),
        [PaymentType.QR_CODE_STATIC_INSTANT]: this.getQrCodeReceipt.bind(this),
        [PaymentType.QR_CODE_STATIC_WITHDRAWAL]:
          this.getQrCodeReceipt.bind(this),
        [PaymentType.QR_CODE_DYNAMIC_DUE_DATE]:
          this.getQrCodeReceipt.bind(this),
        [PaymentType.QR_CODE_DYNAMIC_WITHDRAWAL]:
          this.getQrCodeReceipt.bind(this),
        [PaymentType.QR_CODE_DYNAMIC_CHANGE]: this.getQrCodeReceipt.bind(this),
        [PaymentType.QR_CODE_DYNAMIC_INSTANT]: this.getQrCodeReceipt.bind(this),
      };

      return getReceipt[foundPayment.paymentType](foundPayment);
    }

    const foundDeposit = await this.getPixDepositByOperationIdUseCase.execute(
      operation,
      null,
      wallet,
    );

    if (foundDeposit) {
      if (foundDeposit.hasReceipt()) {
        // If createdAt is not before than today added interval days, the devolution can be requested
        const activeDevolution = foundDeposit.canCreateDevolution(
          this.depositDevolutionIntervalDays,
        );
        return depositReceivedPresenter(foundDeposit, activeDevolution);
      }

      // If is in analysis by compliance, return pix deposit
      if (foundDeposit.isInAnalysis()) {
        return warningDepositPresenter(foundDeposit, true);
      }

      const foundWarningPixDevolution =
        await this.getWarningPixDevolutionByOperationIdUseCase.execute(
          operation,
          foundDeposit.user,
        );

      if (foundWarningPixDevolution) {
        return warningPixDevolutionPresenter(
          foundWarningPixDevolution,
          foundDeposit,
        );
      }

      return null;
    }

    const foundDevolution =
      await this.getPixDevolutionByOperationIdUseCase.execute(
        operation,
        null,
        wallet,
      );

    if (foundDevolution) {
      if (!foundDevolution.hasReceipt()) {
        return null;
      }

      return devolutionSentPresenter(foundDevolution);
    }

    const foundDevolutionReceived =
      await this.getPixDevolutionReceivedByOperationIdUseCase.execute(
        operation,
        null,
        wallet,
      );

    if (foundDevolutionReceived) {
      if (!foundDevolutionReceived.hasReceipt()) {
        return null;
      }

      return devolutionReceivedSentPresenter(foundDevolutionReceived);
    }

    return null;
  }

  private getAccountReceipt(foundPayment: Payment) {
    return foundPayment.state === PaymentState.SCHEDULED
      ? byScheduledAccountPresenter(foundPayment)
      : byImmediateAccountPresenter(foundPayment);
  }

  private getKeyReceipt(foundPayment: Payment) {
    return foundPayment.state === PaymentState.SCHEDULED
      ? byScheduledPixKeyPresenter(foundPayment)
      : byImmediatePixKeyPresenter(foundPayment);
  }

  private getQrCodeReceipt(foundPayment: Payment) {
    const getQrCodeReceiptType = {
      [DecodedQrCodeType.QR_CODE_STATIC_INSTANT_PAYMENT]:
        this.getQrCodeStaticInstantPaymentReceipt,
      [DecodedQrCodeType.QR_CODE_STATIC_WITHDRAWAL]:
        this.getQrCodeStaticWithdrawalPaymentReceipt,
      [DecodedQrCodeType.QR_CODE_DYNAMIC_INSTANT_PAYMENT]:
        this.getQrCodeDynamicInstantPaymentReceipt,
      [DecodedQrCodeType.QR_CODE_DYNAMIC_WITHDRAWAL]:
        this.getQrCodeDynamicWithdrawalPaymentReceipt,
      [DecodedQrCodeType.QR_CODE_DYNAMIC_CHANGE]:
        this.getQrCodeDynamicChangePaymentReceipt,
      [DecodedQrCodeType.QR_CODE_DYNAMIC_DUE_DATE]:
        this.getQrCodeDynamicDuedatePaymentReceipt,
    };

    return getQrCodeReceiptType[foundPayment.decodedQrCode.type](foundPayment);
  }

  private getQrCodeStaticInstantPaymentReceipt(foundPayment: Payment) {
    return foundPayment.state === PaymentState.SCHEDULED
      ? byScheduledStaticQrCodePresenter(foundPayment)
      : byImmediateStaticQrCodePresenter(foundPayment);
  }

  private getQrCodeStaticWithdrawalPaymentReceipt(foundPayment: Payment) {
    return byStaticQrCodeWithdrawalPresenter(foundPayment);
  }

  private getQrCodeDynamicInstantPaymentReceipt(foundPayment: Payment) {
    return foundPayment.state === PaymentState.SCHEDULED
      ? byScheduledDynamicQrCodePresenter(foundPayment)
      : byImmediateDynamicQrCodePresenter(foundPayment);
  }

  private getQrCodeDynamicWithdrawalPaymentReceipt(foundPayment: Payment) {
    return byDynamicQrCodeWithdrawalPresenter(foundPayment);
  }

  private getQrCodeDynamicChangePaymentReceipt(foundPayment: Payment) {
    return byDynamicQrCodeChangePresenter(foundPayment);
  }

  private getQrCodeDynamicDuedatePaymentReceipt(foundPayment: Payment) {
    return foundPayment.state === PaymentState.SCHEDULED
      ? byScheduledDynamicQrCodeDueDatePresenter(foundPayment)
      : byImmediateDynamicQrCodeDueDatePresenter(foundPayment);
  }
}
