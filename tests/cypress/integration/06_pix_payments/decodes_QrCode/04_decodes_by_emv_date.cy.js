import { PixPaymentsPayload as _body } from '../../../payloads/pix_payments/payload';
import { Env, Support as _cy } from '../../../support/support';
describe('TC021 - Test api pix payments decode', () => {
  let env = Env();
  let headers;
  let token;
  let emv;
  let data = _cy.generateData(0);
  let mock_emv;
  _cy._time(60000);
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  before(async () => {
    emv = await _cy.read_json('pix_payments', 'emv_qrcode');
  });

  it('read json file', async () => {
    mock_emv = await _cy.read_json('pix_payments', 'emv_mock');
  });

  it('UC001 - decode by emv and date', async () => {
    const response = await _cy.get_request(
      `${env.pix_payments_decode}?emv=${
        emv.emv !== undefined ? emv.emv : mock_emv.emv
      }`,
      headers,
    );
    const array_path = [
      'id',
      'key',
      'txid',
      'document_value',
      'additional_info',
      'recipient_name',
      'recipient_person_type',
      'recipient_document',
      'type',
      'state',
      'created_at',
      'payment_type',
    ];
    for (let path of array_path) {
      _cy.expect(response, path);
    }
  });

  it('UC002 - decode by emv and date, with invalid EMV', async () => {
    const response = await _cy.get_request(
      `${env.pix_payments_decode}?emv=${_body.emv_invalid}&paymentDate=${data}`,
      headers,
    );
    _cy.expect(
      response,
      'message',
      'Não foi possível realizar esta operação. Por favor tente mais tarde.',
    );
  });
});
