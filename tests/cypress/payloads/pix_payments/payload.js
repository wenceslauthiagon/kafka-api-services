export class PixPaymentsPayload {
  static create = {
    key_id: null,
    value: Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000,
    summary: null,
    description: `description testing ${
      Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000
    }`,
  };
  static decode_by_account = {
    person_type: 'NATURAL_PERSON',
    document: '44742600827',
    bank_ispb: '00000000',
    branch: '2081',
    account_number: '10928189',
    account_type: 'CACC',
  };
  //emv invalid
  static emv_invalid =
    '00020101021126860014BR.GOV.BCB.PIX01368ad0e8f3-dad6-43a7-bc9a-c8379840b38b0224User defined description520400005303986540510.005802BR5910INVALID6006Recife62290525LPHQt9IKJlNRAkG6zVrymu0Sb6304FFFF';
  static body_account = {
    pin: '1234',
    decoded_pix_account_id: null,
    value: 1299,
    payment_date: null,
    description: 'User defined description',
  };
}
