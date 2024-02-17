import { PixPaymentsPayload as _body } from '../../../payloads/pix_payments/payload';
import { Support as _cy, Env } from '../../../support/support';

describe('TC023 - Test api pix payments cretae payments', () => {
  let env = Env();
  let headers;
  let token;
  let id;
  let payload = _body.body_account;
  _cy._time(60000);
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  before(async () => {
    id = await _cy.read_json('pix_payments', 'account_id');
  });
  it('UC001 - POST cretae payments with account', async () => {
    let _data = _cy.generateData(5);
    let body_ = { ...payload };
    body_.decoded_pix_account_id = id.id;
    body_.payment_date = _data;
    const response = await _cy.post_request(
      env.pix_payments_account,
      body_,
      headers,
    );
    _cy.expect(response, 'created_at');
    _cy.expect(response, 'description');
    _cy.expect(response, 'id');
    _cy.expect(response, 'operation_id');
    _cy.expect(response, 'payment_date');
    _cy.expect(response, 'state');
  });
});
