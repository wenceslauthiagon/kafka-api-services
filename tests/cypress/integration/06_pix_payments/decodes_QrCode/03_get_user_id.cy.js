import { DecodeMessage as _mock } from '../../../mocks/pix_payments/decode_banking_account';
import { Env, Support as _cy } from '../../../support/support';

describe('TC020 - Test api pix payments', () => {
  let env = Env();
  let headers;
  let token;
  let pix_id;
  let emv;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers();
  });
  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  before(async () => {
    pix_id = await _cy.read_json('pix_payments', 'qr_code_static');
  });
  it('UC001 - get by id pix_payments', async () => {
    const response = await _cy.get_request(
      `${env.pix_payments}/${pix_id.id}`,
      headers,
    );
    _cy.expect(response, 'id');
    _cy.expect(response, 'key_id');
    _cy.expect(response, 'txid');
    _cy.expect(response, 'value');
    _cy.expect(response, 'summary');
    _cy.expect(response, 'description');
    _cy.expect(response, 'state');
    _cy.expect(response, 'created_at');
    emv = _cy.findInJson(response, 'emv');
  });
  it('create JSON emv', async () => {
    await _cy.write_json('pix_payments', 'emv_qrcode', { emv: emv });
  });
  it('UC002 - get by id pix_payments invalid uuid', async () => {
    const response = await _cy.get_request(
      `${env.pix_payments}/${_cy.uuid_gen()}`,
      headers,
    );
    _cy.expect(
      response,
      'message',
      'Não foi possível processar o seu pedido. Por favor tente novamente.',
    );
  });
  it('create JSON emv mock', async () => {
    await _cy.write_json('pix_payments', 'emv_mock', { emv: _mock.emv });
  });
});
