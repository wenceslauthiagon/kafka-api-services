export interface GetAllBankPspResponse {
  ispb: string;
  name: string;
  fullName: string;
  startedAt: Date;
}

export interface GetAllBankPspGateway {
  getAllBank(): Promise<GetAllBankPspResponse[]>;
}
