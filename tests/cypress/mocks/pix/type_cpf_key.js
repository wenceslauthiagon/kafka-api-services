export class TypeCpf {
  static response_ = {
    success: true,
    data: {
      id: '6eb3f2a4-5e46-422f-a613-409dd6963508',
      key: '08715757001579',
      type: 'CPF',
      state: 'CANCELED',
      created_at: '2023-08-03T20:11:30.174Z',
    },
    error: null,
  };
  static state_ = {
    CONFIRMED: 'CONFIRMED',
    ADD_KEY_READY: 'ADD_KEY_READY',
    DELETING: 'DELETING',
    CANCELED: 'CANCELED',
  };
  static body = {
    type: 'CPF',
    key: null,
  };
}
