export interface AddWarningTransactionCommentRequest {
  issueId: number;
  text: string;
}

export interface AddWarningTransactionCommentGateway {
  addWarningTransactionComment(
    request: AddWarningTransactionCommentRequest,
  ): Promise<void>;
}
