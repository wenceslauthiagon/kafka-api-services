export interface UpdateQrCodeDynamicDueDatePixPaymentPspRequest {
  externalId: string;
  originalDocumentValue?: number;
  rebateValue?: number;
  discountValue?: number;
  interestValue?: number;
  fineValue?: number;
  finalDocumentValue: number;
}

export interface UpdateQrCodeDynamicDueDatePixPaymentPspResponse {
  payloadJws: string;
}

export interface UpdateQrCodeDynamicDueDatePixPaymentPspGateway {
  updateQrCodeDynamicDueDate(
    request: UpdateQrCodeDynamicDueDatePixPaymentPspRequest,
  ): Promise<UpdateQrCodeDynamicDueDatePixPaymentPspResponse>;
}
