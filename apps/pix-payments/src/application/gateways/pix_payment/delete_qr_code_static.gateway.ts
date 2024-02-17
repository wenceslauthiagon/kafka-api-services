export interface DeleteQrCodeStaticPixPaymentPspRequest {
  txId: string;
}

export interface DeleteQrCodeStaticPixPaymentPspGateway {
  deleteQrCodeStatic(
    data: DeleteQrCodeStaticPixPaymentPspRequest,
  ): Promise<void>;
}
